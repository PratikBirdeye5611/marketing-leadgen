import { ILeadGenService } from '../interfaces/lead-gen.service.interface';
import { IContactRequest } from '../../types/contact-request.types';
import { IZohoLeadMessage } from '../../types/zoho-lead.types';
import { IContactRequestService } from '../interfaces/contact-request.service.interface';
import { IValidatorUtilityService } from '../interfaces/validation/validator-utility.service.interface';
import { ICryptoService } from '../interfaces/crypto.service.interface';
import { IGeoIPService } from '../interfaces/geo-ip.service.interface';
import { IScoreService } from '../interfaces/score.service.interface';
import { IZoomInfoService } from '../interfaces/zoom-info.service.interface';
import { ILeadGenHelper } from '../interfaces/lead-gen.helper.interface';
import { ICalendarBookingService } from '../interfaces/calendar-booking.service.interface';
import { IFreeToolsService } from '../interfaces/free-tools.service.interface';
import { IMarketoService } from '../interfaces/marketo.service.interface';
import { ICreateLeadService } from '../interfaces/create-lead.service.interface';
import { IEmailService } from '../interfaces/email.service.interface';
import { IPhoneValidatorService } from '../interfaces/validation/phone-validator.service.interface';
import { InputValidationException } from '../../exceptions/input-validation.exception';
import { PartialLeadFormType, RequestType, LeadStage } from '../../types/enums';
import { IScoreDto, ILeadScoreRequest } from '../../types/score.types';
import { deepClone } from '../../utils/json.util';
import { LeadCache } from '../../cache/lead.cache'
import {
  BazaarifyConstants,
  EmailServiceConstants,
  ErrorCodes,
  LeadGenConstants,
  ParametersConstants,
} from '../../config/constants';
import {
  isBlank,
  isNotBlank,
  getTrimmedBaseURL,
  buildLogSearchKey,
  validateAndUpdatePhoneNumberCode,
  stripAccents,
  trimToNull,
} from '../../utils/string.util';
import { serialize } from '../../utils/json.util';
import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { env } from '../../config/env';
import { Knex } from 'knex';
import { getRedisClient } from '../../cache/redis.client';
import { IBusiness } from '../../types/business.types';

export class LeadGenService implements ILeadGenService {
  private readonly LEAD_VALIDATION_FAILURE = '(Validation Failure):';
  private readonly LEAD_EXCEPTIONAL_FAILURE = '(Exceptional Failure):';
  private readonly KEY_EXPIRY_DAYS = 30;

  constructor(
    private readonly contactRequestService: IContactRequestService,
    private readonly validatorUtility: IValidatorUtilityService,
    private readonly cryptoService: ICryptoService,
    private readonly geoIPService: IGeoIPService,
    private readonly scoreService: IScoreService,
    private readonly zoomInfoService: IZoomInfoService,
    private readonly leadGenHelper: ILeadGenHelper,
    private readonly calendarBookingService: ICalendarBookingService,
    private readonly freeToolsService: IFreeToolsService,
    private readonly marketoService: IMarketoService,
    private readonly createLeadService: ICreateLeadService,
    private readonly emailService: IEmailService,
    private readonly phoneValidator: IPhoneValidatorService,
    private readonly bazaarifyDb: Knex,
    private readonly growthDb: Knex,
    private readonly queuePublisher: (jobName: string, payload: unknown) => Promise<void>,
    private readonly leadCache: LeadCache,
    private readonly businessRepository: any,
  ) {}

  async submitDemoRequest(
    requestMessage: IContactRequest,
    userIpAddress?: string,
    delayInClosestApiCall?: number,
  ): Promise<IZohoLeadMessage> {
    let contactRequestId: number | undefined;

    try {
      requestMessage.webSubmitDateTime = new Date();

      if (isNotBlank(requestMessage.encryptedLeadEmailId)) {
        requestMessage.emailId = this.cryptoService.decryptShared(requestMessage.encryptedLeadEmailId!);
      }
      if (isNotBlank(requestMessage.encryptedLeadPhone)) {
        const phone = this.cryptoService.decryptShared(requestMessage.encryptedLeadPhone!);
        requestMessage.phone = phone;
        requestMessage.mobilePhone = phone;
      }

      requestMessage.emailId = stripAccents(requestMessage.emailId?.trim() ?? '').trim();
      requestMessage.website = getTrimmedBaseURL(requestMessage.website);

      if (isBlank(requestMessage.remoteIp) || !this.isValidIPAddress(requestMessage.remoteIp)) {
        requestMessage.remoteIp = userIpAddress;
      }

      const partialLeadFormType = this.getPartialLeadFormType(requestMessage);

      const contactRequestEntity = await this.contactRequestService.buildAndSaveContactRequest(
        requestMessage,
        partialLeadFormType !== null,
      );
      contactRequestId = contactRequestEntity.id;
      requestMessage.id = contactRequestId;
      requestMessage.createdAt = contactRequestEntity.createdAt;

      requestMessage.logSearchKey = buildLogSearchKey(contactRequestId!, requestMessage.emailId);

      await this.basicInputValidation(requestMessage);
      await this.leadGenHelper.fetchAndSetCountryDetails(requestMessage);

      if (partialLeadFormType !== null) {
        await this.processPartialLeadFormData(partialLeadFormType, requestMessage);
      } else {
        await this.validateLeadGenerationRequest(requestMessage);

        await this.leadCache.cacheLeadEmailByIp(requestMessage.remoteIp!, requestMessage.emailId!);

        if (!requestMessage.skipLead && isNotBlank(requestMessage.buyingIntent)) {
          await this.contactRequestService.blockAllPriorLeads(
            contactRequestId!,
            requestMessage.emailId!,
          );
        }

        const requestMessageCopy: IContactRequest = deepClone(requestMessage);
        setImmediate(() => {
          this.doLeadGenerationProcess(requestMessageCopy, delayInClosestApiCall).catch((err) => {
            console.error('Error in doLeadGenerationProcess:', err);
          });
        });

        return { leadId: null, sfdcUrl: env.sfdc.url };
      }
    } catch (error) {
      if (error instanceof InputValidationException) {
        if (contactRequestId) {
          await this.contactRequestService.setExceptionMessageInContactRequest(
            this.LEAD_VALIDATION_FAILURE,
            contactRequestId,
            error,
          );
          await this.bazaarifyDb('contact_requests').where({ id: contactRequestId }).update({
            lead_created: LeadGenConstants.LEAD_VALIDATION_FAILURE,
          });
        }
      } else {
        if (contactRequestId) {
          await this.contactRequestService.setExceptionMessageInContactRequest(
            this.LEAD_EXCEPTIONAL_FAILURE,
            contactRequestId,
            error as Error,
          );
          await this.bazaarifyDb('contact_requests').where({ id: contactRequestId }).update({
            lead_created: LeadGenConstants.LEAD_EXCEPTION,
          });
        }
      }
      throw error;
    }

    return { leadId: null, sfdcUrl: env.sfdc.url };
  }

  async doLeadGenerationProcess(
    requestMessage: IContactRequest,
    delayInClosestApiCall?: number,
  ): Promise<void> {
    try {
      await this.updateLeadCreationRequestObject(requestMessage);

      const contactRequestEntity = await this.contactRequestService.buildAndSaveContactRequest(
        requestMessage,
        false,
      );

      await this.submitDemoRequestToMarketo(requestMessage, false);

      if (delayInClosestApiCall && delayInClosestApiCall > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayInClosestApiCall * 1000));
      }

      await this.processCalendarBookingRequest(requestMessage);

      if (!requestMessage.freemiumRequest) {
        await this.doBusinessAggregationIfSourceIsGoogle(requestMessage);
      }

      // await this.queuePublisher('BUSINESS_AND_LEAD_CREATE', { requestMessage });
      const requestMessageForLead: IContactRequest = deepClone(requestMessage);
      setImmediate(() => {
        this.createLeadService.businessLeadAndCreateEvent(requestMessageForLead).catch((err) => {
          console.error('Error in businessLeadAndCreateEvent:', err);
        });
      });


      if (isNotBlank(requestMessage.meetingId)) {
        this.sendCalendarInviteAsync(requestMessage).catch(() => {});
      }

      await this.sendPostLeadEmails(requestMessage);
    } catch (error) {
      console.error('Exception while processing lead generation request', error);
    }
  }

  async genericEmailDemoRequest(contactRequest: IContactRequest): Promise<void> {
    try {
      await this.basicInputValidation(contactRequest);
      await this.validateLeadGenerationRequest(contactRequest);

      await this.bazaarifyDb('generic_email_contact_request').insert({
        ...contactRequest,
        need_reprocess: true,
        created_at: new Date(),
      });
    } catch (error) {
      if (error instanceof InputValidationException) {
        await this.bazaarifyDb('generic_email_contact_request').insert({
          ...contactRequest,
          need_reprocess: false,
          created_at: new Date(),
        });
      }
      throw error;
    }
  }

  async shouldSendInvite(contactRequest: IContactRequest): Promise<boolean> {
    return this.calendarBookingService.shouldSendInvite(contactRequest);
  }

  // async doBusinessAggregationIfSourceIsGoogle(contactRequest: IContactRequest): Promise<void> {
  //   if (contactRequest.fromGoogle === 1) {
  //     // await this.queuePublisher('BUSINESS_AGGREGATION', { contactRequest });
  //     console.log('[BusinessAggregation] Skipped - queue disabled for local dev');
  //   }
  // }

  async doBusinessAggregationIfSourceIsGoogle(contactRequest: IContactRequest): Promise<void> {
    if (contactRequest.fromGoogle === 1) {
      setImmediate(() => {
        this.handleBusinessAggregationEvent(contactRequest).catch((e) => {
          console.error(`Exception while creation requesting Business Aggregation through API call for businessNumber: ${contactRequest.businessNumber}, reason:`, e);
        });
      });
    }
  }

  private async handleBusinessAggregationEvent(contactRequest: IContactRequest): Promise<void> {
    const existingBusiness = await this.fetchBusinessById(contactRequest.businessNumber);
    if (existingBusiness) {
      await this.leadGenHelper.createBusinessAggregation(existingBusiness, contactRequest, BazaarifyConstants.FREE);
    }
  }

  async fetchBusinessById(businessNumber: string | undefined): Promise<IBusiness | null> {
    if (!businessNumber) return null;
    return this.businessRepository.findByBusinessId(Number(businessNumber));
  }

  async fetchLeadScoreById(requestId: number): Promise<number | null> {
    try {
      const entity = await this.contactRequestService.findByContactRequestId(requestId);
      if (!entity) return null;
      const scoreRequest: ILeadScoreRequest = {
        emailId: entity.contacts?.emailId,
        businessName: entity.businessInfo?.businessName,
        industry: entity.businessInfo?.industry,
        country: entity.location?.country,
        countryCode: entity.location?.countryCode,
        numberOfEmployees: entity.businessInfo?.numberOfEmployees,
        annualRevenue: entity.businessInfo?.annualRevenue,
        businessLocations: entity.businessInfo?.businessLocations,
        fromGoogle: entity.fromGoogle,
        leadSource: entity.campaign?.leadSource,
        requestType: entity.requestType,
      };
      const score = await this.scoreService.getLeadScore(scoreRequest);
      return score.score;
    } catch {
      return null;
    }
  }

  private getPartialLeadFormType(requestMessage: IContactRequest): PartialLeadFormType | null {
    if (isBlank(requestMessage.businessName)) {
      return PartialLeadFormType.FREE_TRIAL_BY_EMAIL;
    }
    return null;
  }

  private async processPartialLeadFormData(
    type: PartialLeadFormType,
    requestMessage: IContactRequest,
  ): Promise<void> {
    if (type === PartialLeadFormType.FREE_TRIAL_BY_EMAIL) {
      await this.submitDemoRequestToMarketo(requestMessage, true);
    }
  }

  private async basicInputValidation(requestMessage: IContactRequest): Promise<void> {
    await this.emailInputValidation(requestMessage);
    if (isBlank(requestMessage.name) && isBlank(requestMessage.lastName)) {
      throw new InputValidationException(ErrorCodes.LAST_NAME_NOT_SUPPLIED);
    }
  }

  private async emailInputValidation(requestMessage: IContactRequest): Promise<void> {
    if (isBlank(requestMessage.emailId)) {
      throw new InputValidationException(ErrorCodes.EMAIL_ID_NOT_SUPPLIED);
    }
    if (requestMessage.emailId!.length > LeadGenConstants.EMAIL_ID_MAX_LENGTH) {
      throw new InputValidationException(ErrorCodes.EMAIL_ID_TOO_LONG, [requestMessage.emailId]);
    }
    if (requestMessage.emailId!.length < LeadGenConstants.EMAIL_ID_MIN_LENGTH) {
      throw new InputValidationException(ErrorCodes.EMAIL_ID_TOO_SHORT, [requestMessage.emailId]);
    }
    if (!requestMessage.skipEmailValidation) {
      const result = await this.validatorUtility.validateEmailWithReason(requestMessage.emailId!);
      if (!result.isValid) {
        throw new InputValidationException(
          ErrorCodes.INVALID_EMAIL_ID,
          [requestMessage.emailId],
          result.reason,
          'WARN',
        );
      }
    }
    if (
      (await this.validatorUtility.isBirdeyeDomain(requestMessage.emailId!)) &&
      requestMessage.requestType !== RequestType.SCAN
    ) {
      throw new InputValidationException(
        ErrorCodes.INVALID_EMAIL_ID,
        [requestMessage.emailId],
        'Email has birdeye domain and request type is not scan',
        'WARN',
      );
    }
  }

  private async validateLeadGenerationRequest(requestMessage: IContactRequest): Promise<void> {
    const businessName = trimToNull(requestMessage.businessName);

    if (
      !requestMessage.skipBusinessNameValidation &&
      businessName &&
      businessName.length < LeadGenConstants.BUSINESS_NAME_MIN_ALLOWED_LENGTH
    ) {
      throw new InputValidationException(ErrorCodes.BUSINESS_NAME_TOO_SHORT, [businessName]);
    }
    if (businessName && businessName.length > LeadGenConstants.BUSINESS_NAME_MAX_ALLOWED_LENGTH) {
      throw new InputValidationException(ErrorCodes.BUSINESS_NAME_TOO_LONG, [businessName]);
    }
    if (!(await this.validatorUtility.isSupportedValidCountry(requestMessage.countryCode ?? ''))) {
      throw new InputValidationException(
        ErrorCodes.OUT_OF_REGION,
        [requestMessage.countryCode],
        undefined,
        'WARN',
      );
    }
    if (
      !requestMessage.skipLeadLimitValidation &&
      !(await this.leadCache.canCreateLeadByIp(requestMessage.remoteIp!, requestMessage.emailId!))
    ) {
      throw new InputValidationException(
        ErrorCodes.LEAD_LIMIT_EXCEEDED,
        undefined,
        'Limit for Lead creation is exhausted',
        'WARN',
      );
    }

    const phoneNo = trimToNull(requestMessage.phone);
    if (!phoneNo) {
      throw new InputValidationException(ErrorCodes.PHONE_NO_NOT_SUPPLIED, [phoneNo], undefined, 'WARN');
    }

    let updatedPhone = validateAndUpdatePhoneNumberCode(phoneNo);
    updatedPhone = this.phoneValidator.formatPhoneToE164(
      updatedPhone,
      requestMessage.countryCode || 'US',
    );
    requestMessage.phone = updatedPhone;

    if (isBlank(updatedPhone)) {
      throw new InputValidationException(
        ErrorCodes.INVALID_PHONE_NO,
        [phoneNo],
        'Unable to parse phone to E164',
        'WARN',
      );
    }

    if (!requestMessage.skipPhoneValidation) {
      const phoneValidation = await this.lookupPhone(updatedPhone);
      if (
        phoneValidation &&
        (isNotBlank(phoneValidation.failureReason) ||
          isBlank(phoneValidation.countryCode) ||
          phoneValidation.carrierType?.toLowerCase() === 'invalid')
      ) {
        throw new InputValidationException(
          ErrorCodes.INVALID_PHONE_NO,
          [phoneNo],
          `Invalid phone: ${JSON.stringify(phoneValidation)}`,
          'WARN',
        );
      }
    }

    if (
      isNotBlank(requestMessage.businessPhone) &&
      (requestMessage.fromGoogle == null || requestMessage.fromGoogle !== 1)
    ) {
      const updatedBizPhone = validateAndUpdatePhoneNumberCode(requestMessage.businessPhone!);
      requestMessage.businessPhone = updatedBizPhone;
      if (!(await this.phoneValidator.isValidPhoneNumberDemoRequest(updatedBizPhone))) {
        requestMessage.businessPhone = requestMessage.phone;
      }
    }

    if (
      isNotBlank(requestMessage.zip) &&
      requestMessage.zip!.length > LeadGenConstants.BUSINESS_ZIP_MAX_ALLOWED_LENGTH
    ) {
      throw new InputValidationException(ErrorCodes.INVALID_ZIP_CODE, [requestMessage.zip]);
    }

    if (
      isNotBlank(requestMessage.comments) &&
      requestMessage.comments!.length > LeadGenConstants.BUSINESS_COMMENTS_MAX_ALLOWED_LENGTH
    ) {
      throw new InputValidationException(ErrorCodes.COMMENTS_TOO_LONG);
    }
  }

  private async updateLeadCreationRequestObject(requestMessage: IContactRequest): Promise<void> {
    requestMessage.userMessage = requestMessage.comments;
    requestMessage.businessNumber = await this.leadGenHelper.getBusinessNumber(requestMessage);

    if (await this.canProcessZoomInfo(requestMessage)) {
      await this.processZoomInfo(requestMessage);
    }

    await this.leadGenHelper.fetchAndSetCountryDetails(requestMessage);
    this.leadGenHelper.partnerFormComment(requestMessage);

    if (requestMessage.fromGoogle === 1) {
      const industryFromGoogle = requestMessage.industry;
      if (isNotBlank(industryFromGoogle)) {
        const mapped = await this.bazaarifyDb('industries')
          .where({ name: industryFromGoogle, source_id: LeadGenConstants.GOOGLE_SOURCE_ID })
          .first();
        requestMessage.sourceIndustry = industryFromGoogle;
        requestMessage.industry = mapped?.be_main_category ?? LeadGenConstants.OTHER;
        if (mapped) requestMessage.subIndustry1 = mapped.be_parent_category;
      }
    } else {
      this.leadGenHelper.capitalizeBusinessName(requestMessage.businessName);
    }

    if (requestMessage.subIndustry1 === 'Pubs') requestMessage.industry = 'Restaurants';

    this.calendarBookingService.setCalendarInviteCommentInRequest(requestMessage);
    requestMessage.leadRank = this.leadGenHelper.getLeadRankByIndustry(requestMessage.industry) as any;

    if (!this.validatorUtility.isValidSfdcUserId(requestMessage.leadOwner ?? '')) {
      requestMessage.leadOwner = undefined;
      requestMessage.leadAutoAssignment = undefined;
    } else {
      requestMessage.leadAutoAssignment = true;
    }

    this.leadGenHelper.leadSfdcCampaignComment(requestMessage);
    this.leadGenHelper.leadCrmInfoComment(requestMessage);

    if (
      isNotBlank(requestMessage.businessName) &&
      isNotBlank(requestMessage.phone) &&
      isNotBlank(requestMessage.zip)
    ) {
      const scanReport = await this.freeToolsService.generateScanReportUrlForLead(requestMessage);
      if (isNotBlank(scanReport)) requestMessage.scanReportUrl = scanReport;
    }

    if (requestMessage.leadStage !== LeadStage.SUSPECT) {
      await this.updateLeadScore(requestMessage);
    }
  }

  private async updateLeadScore(requestMessage: IContactRequest): Promise<void> {
    try {
      const scoreRequest: ILeadScoreRequest = {
        emailId: requestMessage.emailId,
        businessName: requestMessage.businessName,
        industry: requestMessage.industry,
        country: requestMessage.country,
        countryCode: requestMessage.countryCode,
        numberOfEmployees: requestMessage.numberOfEmployees,
        annualRevenue: requestMessage.annualRevenue,
        businessLocations: requestMessage.businessLocations,
        fromGoogle: requestMessage.fromGoogle,
        leadSource: requestMessage.leadSource,
        requestType: requestMessage.requestType,
      };
      const score = await this.scoreService.getLeadScore(scoreRequest);
      console.log(`[LeadGenService] Lead score for request ${requestMessage.id} is ${score.score}`);
      if (score) {
        requestMessage.leadScore = score.score;
        requestMessage.scoreConfidence = score.isUncertain ? 'Low' : 'High';
        requestMessage.scoreColorCode = serialize(score.colorCode);
      }
    } catch (e) {
      console.error(`[LeadGenService] Failed to compute lead score for request ${requestMessage.id}:`, e);
    }
  }

  private async processZoomInfo(requestMessage: IContactRequest): Promise<void> {
    const result = await this.zoomInfoService.processContactRequest(
      requestMessage.id!,
      requestMessage.emailId!,
      requestMessage.businessName,
      requestMessage.zip,
    );
    if (!result) return;

    const { contact, company } = result;

    if (contact) {
      if (isBlank(requestMessage.firstName) && isNotBlank(contact.firstName))
        requestMessage.firstName = contact.firstName;
      if (isBlank(requestMessage.lastName) && isNotBlank(contact.lastName))
        requestMessage.lastName = contact.lastName;
      if (isBlank(requestMessage.title) && isNotBlank(contact.jobTitle))
        requestMessage.title = contact.jobTitle;
      requestMessage.zoominfoProfile = contact.profile;

      const contactPhone = contact.phone
        ? this.phoneValidator.formatPhoneToE164(contact.phone, contact.country ?? 'US')
        : null;
      if (
        (isBlank(requestMessage.phone) ||
          this.phoneValidator.isPhoneMatch(LeadGenConstants.BIRDEYE_PHONE_NUMBER, requestMessage.phone!)) &&
        isNotBlank(contactPhone)
      ) {
        requestMessage.phone = contactPhone!;
        requestMessage.mobilePhone = contactPhone!;
      }
    }

    if (company) {
      if (isBlank(requestMessage.businessName) && isNotBlank(company.name))
        requestMessage.businessName = company.name;
      if (isBlank(requestMessage.website) && isNotBlank(company.website))
        requestMessage.website = company.website;
      if (isBlank(requestMessage.street) && isNotBlank(company.street))
        requestMessage.street = company.street;
      if (isBlank(requestMessage.city) && isNotBlank(company.city))
        requestMessage.city = company.city;
      if (isBlank(requestMessage.state) && isNotBlank(company.state))
        requestMessage.state = company.state;
      if (isBlank(requestMessage.zip) && isNotBlank(company.zipCode))
        requestMessage.zip = company.zipCode;
      if (isBlank(requestMessage.country) && isNotBlank(company.country))
        requestMessage.country = company.country;
      if (isBlank(requestMessage.businessLocations) && company.locationCount)
        requestMessage.businessLocations = String(company.locationCount);
      if (!requestMessage.numberOfEmployees && company.employeeCount)
        requestMessage.numberOfEmployees = company.employeeCount;

      const companyPhone = company.phone
        ? this.phoneValidator.formatPhoneToE164(company.phone, company.country ?? 'US')
        : null;
      if (
        (isBlank(requestMessage.businessPhone) ||
          this.phoneValidator.isPhoneMatch(LeadGenConstants.BIRDEYE_PHONE_NUMBER, requestMessage.businessPhone!)) &&
        isNotBlank(companyPhone)
      ) {
        requestMessage.businessPhone = companyPhone!;
      }
    }

    requestMessage.zoominfoProcessed = 1;
  }

  private async canProcessZoomInfo(requestMessage: IContactRequest): Promise<boolean> {
    if (requestMessage.skipZoomInfoProcess) return false;
    try {
      const enabledRow = await this.growthDb('parameters')
        .where({ name: ParametersConstants.ZOOM_INFO_ENABLED })
        .first();
      if (enabledRow?.value !== 'true') return false;

      const excludedRow = await this.growthDb('parameters')
        .where({ name: ParametersConstants.ZOOM_INFO_EXCLUDED_EMAIL_DOMAINS })
        .first();
      const excluded: string[] = excludedRow?.value
        ? excludedRow.value.split(',')
        : ['birdeyelead@gmail.com', 'engineeringqa023@gmail.com', '@birdeye.com', '@birdeye.org'];

      return !excluded.some((domain) => requestMessage.emailId?.includes(domain));
    } catch {
      return false;
    }
  }

  private async processCalendarBookingRequest(requestMessage: IContactRequest): Promise<void> {
    try {
      const shouldSend = await this.shouldSendInvite(requestMessage);
      if (shouldSend) {
        await this.calendarBookingService.sendGoogleCalendarInvite(requestMessage);
      }
    } catch (e) {
      console.error('Error processing calendar booking request:', e);
    }
  }

  private async sendPostLeadEmails(requestMessage: IContactRequest): Promise<void> {
    if (
      isNotBlank(requestMessage.leadUrl) &&
      requestMessage.leadUrl!.includes(LeadGenConstants.REVIEW_MASTERCLASS_LEAD_URL)
    ) {
      await this.emailService.sendInstantEmailRequestToEmailMicroservice(
        'review_masterclass',
        { emailIds: [requestMessage.emailId!] },
        EmailServiceConstants.FREE,
      );
    }
  }

  private async submitDemoRequestToMarketo(
    requestMessage: IContactRequest,
    isPartialLead: boolean,
  ): Promise<void> {
    try {
      const enabledRow = await this.growthDb('parameters')
        .where({ name: ParametersConstants.MARKETO_ENABLED })
        .first();
      if (enabledRow?.value !== 'true' || requestMessage.skipMarketoProcess) return;
      await this.marketoService.submitDemoRequestToMarketo(requestMessage, isPartialLead);
    } catch { }
  }

  private async sendCalendarInviteAsync(requestMessage: IContactRequest): Promise<void> {
    if (!requestMessage.emailId || !requestMessage.meetingId) return;
    try {
      const eventResponse = await this.calendarBookingService.getCalendarEventDetailsById(
        requestMessage.organiserEmailId!,
        requestMessage.calendarEventId!,
      );
      if (eventResponse.endTime && !this.isExpiredEvent(eventResponse.endTime)) {
        const attendees = [...(eventResponse.attendees ?? []), requestMessage.emailId];
        await this.calendarBookingService.patchEvent(
          { attendeeEmailIds: attendees, organizerEmailIds: [requestMessage.organiserEmailId!] },
          requestMessage.calendarEventId!,
          requestMessage.meetingId!,
        );
      }
    } catch (e) {
      console.error('Error sending calendar invite asynchronously:', e);
    }
  }

  private isExpiredEvent(endTime: string): boolean {
    return Date.now() > new Date(endTime).getTime();
  }

  private async lookupPhone(phone: string): Promise<{ failureReason?: string; countryCode?: string; carrierType?: string } | null> {
    try
    {
      const key = `NexusLookup:${phone}`;
      const client = getRedisClient();

      const cached = await client.get(key);
      let value = cached ? JSON.parse(cached) : null;
      console.log(`Retrieved phone number ${phone} lookup info ${JSON.stringify(value)} from cache`);

      if (!value) {
        value = await createAPICall<{ failureReason?: string; countryCode?: string; carrierType?: string }>(`${env.nexus.baseUrl}/sms/lookup-number`, 'POST', constructHttpHeader(), { rawPhoneNumber: phone });
        console.log(`fetched phone number ${phone} lookup info ${JSON.stringify(value)} from nexus`);
        if (value) {
          await client.set(key, JSON.stringify(value), 'EX', this.KEY_EXPIRY_DAYS * 24 * 60 * 60);
        }
      } else {
        console.log(`Phone validation info for number ${phone} found in cache, skipping Nexus call`);
      }

      return value;
    }
    catch (error) {
      console.error(`Error looking up phone number ${phone}:`, error);
      return null;
    }
  }

  private isValidIPAddress(ip?: string): boolean {
    if (!ip) return false;
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4.test(ip) && ip.split('.').map(Number).every((n) => n >= 0 && n <= 255);
  }
}
