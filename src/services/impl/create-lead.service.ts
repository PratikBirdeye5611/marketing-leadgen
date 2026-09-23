import { ICreateLeadService } from '../interfaces/create-lead.service.interface';
import { IContactRequest } from '../../types/contact-request.types';
import { IContact, ILead } from '../../types/sfdc-lead.types';
import { ISFDCLeadOperationHelper } from '../interfaces/sfdc-lead-operation.helper.interface';
import { ISFDCLeadRequestBuilder } from '../interfaces/sfdc-lead-request.builder.interface';
import { IContactRequestService } from '../interfaces/contact-request.service.interface';
import { ILeadGenHelper } from '../interfaces/lead-gen.helper.interface';
import { SFDCLeadStatus, ExistingLeadStatus, LeadRequestType, LeadSource } from '../../types/enums';
import { LeadGenConstants, SFDCQueryParamConstants, APIEndpoints, SfdcConstants, KafkaTopicsConstants } from '../../config/constants';
import { isNotBlank, isBlank, getTrimmedBaseURL, decodeValue } from '../../utils/string.util';
import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { env } from '../../config/env';
import { Knex } from 'knex';
import { LeadCache } from '../../cache/lead.cache';
import { KafkaProducer } from '../../kafka/kafka.producer';
import { IKafkaMessage, IUpsellConvertLeadKafkaMessage } from '../../types/kafka.types';

const kafkaProducer = new KafkaProducer();

export class CreateLeadService implements ICreateLeadService {
  constructor(
    private readonly sfdcHelper: ISFDCLeadOperationHelper,
    private readonly sfdcBuilder: ISFDCLeadRequestBuilder,
    private readonly contactRequestService: IContactRequestService,
    private readonly leadGenHelper: ILeadGenHelper,
    private readonly db: Knex,
    private readonly leadCacheService: LeadCache,
  ) {}


  async businessLeadAndCreateEvent(requestMessage: IContactRequest): Promise<void> {
    try
    {
      let contactRequestId: number | undefined = requestMessage.id;
      if (contactRequestId != null) {
        const isScanFromGoogle =
          requestMessage.requestType?.toString().toLowerCase() === LeadRequestType.SCAN.toLowerCase() &&
          requestMessage.fromGoogle === 1;

        const isWebLead = requestMessage.leadSource?.toLowerCase() === LeadSource.WEB_LEAD.toLowerCase();

        if (!isScanFromGoogle && isWebLead && !requestMessage.freemiumRequest && requestMessage.zip) {
          const checkinMessage = kafkaProducer.constructCreateBusinessMessage(
            KafkaTopicsConstants.CREATE_BUSINESS_KAFKA_TOPIC,
            requestMessage,
            contactRequestId,
          );

          console.log(
            `Sending message to kafka topic ${KafkaTopicsConstants.CREATE_BUSINESS_KAFKA_TOPIC} for business creation for ContactRequestId: ${contactRequestId} and EmailId: ${requestMessage.emailId}`,
          );

          await kafkaProducer.sendMessage(checkinMessage);
        }
        if (!requestMessage.supportSkipLead && !requestMessage.skipLead) {
            try {
                await this.leadCreationAndFollowingOperations(requestMessage);
            } catch (e) {
                console.error(`Error occurred while creating lead for ContactRequestId: ${contactRequestId}, emailId: ${requestMessage?.emailId}`, e);
            }
          }
      } else {
        console.error(`ContactRequestId is blank, id: ${contactRequestId}, emailId: ${requestMessage?.emailId}`);
      }
    }
    catch (e) {
      console.error(`Error occurred while processing business lead and create event for ContactRequestId: ${requestMessage?.id}, emailId: ${requestMessage?.emailId}`, e);
    }
  }


  async leadCreationAndFollowingOperations(contactRequest: IContactRequest): Promise<void> {
    const leadId = await this.pushSFDCLead(contactRequest);
    await this.postLeadCreationAction(leadId, contactRequest);

    if(contactRequest.upsellRequest)
    {
        await kafkaProducer.sendMessage({
          kafkaTopic: KafkaTopicsConstants.UPSELL_CONVERT_LEAD_WITH_ACCOUNT,
          messageObject: {
            contactRequest,
            leadId,
          },
          contactRequestId: contactRequest.id,
        } as IKafkaMessage<IUpsellConvertLeadKafkaMessage<IContactRequest>>);
    }
    try {
      const reportDescription = this.leadGenHelper.triggerReputationGapAnalysisReport(leadId);
      await this.updateLeadDescription(leadId, reportDescription, true);
    } catch { }
  }

  async pushSFDCLead(contactRequest: IContactRequest): Promise<string> {
    this.updateRequestMessageFieldsBeforeSendingToSFDC(contactRequest);
    return this.createLeadRecord(contactRequest, false);
  }

  async createLeadRecord(requestMessage: IContactRequest, isRetriedLead: boolean): Promise<string> {
      console.log(`Searching existing lead in SFDC with email: ${requestMessage.emailId} for request: ${JSON.stringify(requestMessage)}`);

      const existingLead = await this.searchAndSetSFDCLeadByEmail(requestMessage);
      let leadId = existingLead?.Id ?? null;

      if (isBlank(leadId)) {
        console.log(`No existing lead found in SFDC with email: ${requestMessage.emailId}. So, initiating lead creation for request: ${JSON.stringify(requestMessage)}`);
        leadId = await this.requestToCreateNewSFDCLead(requestMessage);
      } else {
        console.log(`Found existing lead in SFDC with email: ${requestMessage.emailId} and leadId: ${leadId} for request: ${JSON.stringify(requestMessage)}`);

        if (existingLead!.Status === SFDCLeadStatus.CONVERTED) {
          if (isNotBlank(existingLead!.ConvertedContactId)) {
            console.log(`Found existing converted lead, initiating converted contact ${existingLead!.ConvertedContactId} update.`);
            await this.sfdcBuilder.requestToUpdateSFDCLead(requestMessage, existingLead!);
            await this.requestToUpdateSFDCContactForConvertedLead(requestMessage, existingLead!.ConvertedContactId!);
            requestMessage.sfdcContactId = existingLead!.ConvertedContactId;
          } else {
            console.log('Found existing lead status to be converted, No converted contact found, So, initiating clone process. Set email, phone and mobile phone empty');
            existingLead!.Email = '';
            existingLead!.Phone = '';
            existingLead!.MobilePhone = '';
            await this.sfdcHelper.callToUpdateSFDCLead(existingLead!, null);
            await this.leadCacheService.removeLeadIdByEmail(requestMessage.emailId!);

            console.log(`Re-creation of lead with original lead field: ${existingLead!.Id}`);
            requestMessage.original_Lead__c = existingLead!.Id;
            leadId = await this.requestToCreateNewSFDCLead(requestMessage);
          }
        } else {
          console.log(`Existing lead found with non-converted status: ${existingLead!.Status}, initiating update for request: ${JSON.stringify(requestMessage)}`);
          if (isRetriedLead && LeadGenConstants.SFDC_DEFAULT_OWNER_ID.toLowerCase() === (requestMessage.leadOwner ?? '').toLowerCase()) {
            requestMessage.leadOwner = undefined;
          }
          await this.sfdcBuilder.requestToUpdateSFDCLead(requestMessage, existingLead!);
        }
      }

    requestMessage.sfdcLeadId = leadId ?? undefined;
    return leadId ?? '';
  }

  private async requestToUpdateSFDCContactForConvertedLead(message: IContactRequest, contactId: string): Promise<void> {
    const response = await this.sfdcHelper.getSfdcEntity(contactId, SfdcConstants.CONTACT);
    const existingContact: IContact | null = response ? JSON.parse(response) : null;

    if (existingContact) {
      console.log(`Found existing sfdc contact: ${JSON.stringify(existingContact)} for request: ${JSON.stringify(message)}, contactId: ${contactId}`);
      const contact = await this.sfdcBuilder.buildSFDCContact(message, contactId, existingContact);
      await this.sfdcHelper.callToUpdateSfdcResource(contact, SfdcConstants.CONTACT, contactId, null);
    } else {
      console.log(`unable to get the existing converted sfdc contact for request: ${JSON.stringify(message)}, contactId: ${contactId}`);
    }
  }

  async searchAndSetSFDCLeadByEmail(requestMessage: IContactRequest): Promise<ILead | null> {
    let existingLead: ILead | null = null;

    let leadId = await this.leadCacheService.getLeadIdByEmail(requestMessage.emailId!);

    if (isBlank(leadId)) {
      existingLead = await this.sfdcHelper.callToSearchLeadByEmail(requestMessage.emailId!,
        SFDCQueryParamConstants.RETURN_FIELD_WITH_LEAD_CONTACT_ACCOUNT_INFO,);

      if (existingLead) {
        requestMessage.sfdcLeadId = existingLead.Id;
        if (isNotBlank(existingLead.Id)) {
          leadId = existingLead.Id!;
          await this.leadCacheService.cacheLeadIdByEmail(requestMessage.emailId!, leadId);
        }
      }
    }

    if (isNotBlank(leadId) && (existingLead == null || SFDCLeadStatus.CONVERTED  !== existingLead.Status)) {
      try {
        return await this.sfdcHelper.callToGetExistingSFDCLead(leadId!);
      } catch (ex) {
        console.error(
          `Error while fetching lead by Id in create lead flow, Email: ${requestMessage.emailId}`,
          ex,
        );
        await this.leadCacheService.removeLeadIdByEmail(requestMessage.emailId!);
        existingLead = null;
      }
    }

    return existingLead;
  }

  async updateLeadDescription(leadId: string, newContent: string, append: boolean): Promise<void> {
    if (isBlank(leadId) || isBlank(newContent)) return;
    const existingLead = await this.sfdcHelper.callToSearchLeadById(leadId, 'Description,Status');
    if (!existingLead) return;

    const existingDesc = existingLead.Description ?? '';
    const updatedDesc = append && isNotBlank(existingDesc)
      ? `${existingDesc}\n${newContent}`
      : newContent;

    const leadToUpdate: ILead = { Id: leadId, Description: updatedDesc };
    await this.sfdcHelper.callToUpdateSFDCLead(leadToUpdate, existingLead.Status ?? null);
  }

  async filterLeadRequest(lead: ILead): Promise<void> {
    await this.sfdcHelper.callToResetIndustry(lead);
  }

private updateRequestMessageFieldsBeforeSendingToSFDC(contactRequest: IContactRequest): void {
    const normalize = (v?: string) =>
      v ? this.leadGenHelper.getTrimmedLeadCampaignToUpdateSFDCLead(
        this.leadGenHelper.getNormalizedString(v),
      ) : v;

    contactRequest.leadCampaign = normalize(contactRequest.leadCampaign);
    contactRequest.leadSubCampaign = normalize(contactRequest.leadSubCampaign);
    contactRequest.leadCampaignKW = normalize(contactRequest.leadCampaignKW);
    contactRequest.leadContent = this.leadGenHelper.getTrimmedLeadContentToUpdateSFDCLead(
      this.leadGenHelper.getNormalizedString(contactRequest.leadContent ?? ''),
    );
    contactRequest.leadMedium = this.leadGenHelper.getTrimmedLeadMediumToUpdateSFDCLead(
      this.leadGenHelper.getNormalizedString(contactRequest.leadMedium ?? ''),
    );
  }

  private async requestToCreateNewSFDCLead(contactRequest: IContactRequest): Promise<string> {
    contactRequest.existingLeadStatus = ExistingLeadStatus.CREATED;
    const lead = this.sfdcBuilder.buildLeadRequest(contactRequest, null);
    const leadId = await this.sfdcHelper.callToCreateNewSFDCLeadAndCacheIt(lead);
    return leadId;
  }

  private async postLeadCreationAction(
    leadId: string,
    contactRequest: IContactRequest,
  ): Promise<void> {
    await this.contactRequestService.flushLeadCreationStatusInContactRequest(
      leadId,
      contactRequest.id!,
      contactRequest.forcefulLead
        ? LeadGenConstants.FORCEFULLY_LEAD_CREATED
        : LeadGenConstants.SUCCESSFULLY_LEAD_CREATED,
      contactRequest.emailId!,
      contactRequest.existingLeadStatus,
      contactRequest.sfdcContactId,
    );
    if(isNotBlank(contactRequest.formFillId)) {
      await this.notifyTracklytics(contactRequest, leadId);
    }
  }

  private async notifyTracklytics(
    contactRequest: IContactRequest,
    leadId: string,
  ): Promise<void> {
    try {
      const url = `${env.tracklytics.baseUrl}${LeadGenConstants.TRACKLYTICS_LEAD_URL}`;
      await createAPICall(url, 'POST', constructHttpHeader(), {
        formFillId: contactRequest.formFillId,
        zoho_lead_id : leadId,
        existingLeadStatus: contactRequest.existingLeadStatus,
        sfdcContactId: contactRequest.sfdcContactId,
      });
    } catch { }
  }
}