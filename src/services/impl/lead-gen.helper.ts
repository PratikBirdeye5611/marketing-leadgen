import { ILeadGenHelper } from '../interfaces/lead-gen.helper.interface';
import { IContactRequest } from '../../types/contact-request.types';
import { IGeoIPService } from '../interfaces/geo-ip.service.interface';
import { getISOCode, getCountryName } from '../../utils/country.util';
import { normalizeString, isNotBlank, isBlank } from '../../utils/string.util';
import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { env } from '../../config/env';
import { Knex } from 'knex';
import { APIEndpoints, BazaarifyConstants, LeadGenConstants } from '../../config/constants';
import { IBusiness, IBusinessAggregationRequest, IBusinessFindRequestBAM, ICreateAggregationInputMessage } from '../../types/business.types';
import { AggregationSourceRepository } from '../../repositories/bazaarify/aggregation.repo';

const MAX_CAMPAIGN_LENGTH = 100;
const MAX_CONTENT_LENGTH = 100;
const MAX_MEDIUM_LENGTH = 50;

export class LeadGenHelper implements ILeadGenHelper {
  constructor(
    private readonly db: Knex,
    private readonly geoIPService: IGeoIPService,
    private readonly aggregationSourceRepository: AggregationSourceRepository,
  ) {}

  async fetchAndSetCountryDetails(contactRequest: IContactRequest): Promise<void> {
    if (isBlank(contactRequest.countryCode)) {
      if (isNotBlank(contactRequest.country)) {
        if (contactRequest.country === 'United States of America') {
          contactRequest.country = 'United States';
        }
        contactRequest.countryCode = getISOCode(contactRequest.country!);
      } else if (isNotBlank(contactRequest.remoteIp)) {
        const geo = await this.geoIPService.getCountryFromIP(contactRequest.remoteIp!);
        if (geo?.countryCode) {
          contactRequest.countryCode = geo.countryCode;
        }
      }
    }

    if (isNotBlank(contactRequest.countryCode)) {
      if (contactRequest.countryCode?.toUpperCase() === 'UK') {
        contactRequest.country = 'United Kingdom';
      } else {
        contactRequest.country = getCountryName(contactRequest.countryCode!);
      }
    }
  }

  getLeadRankByIndustry(_industry?: string): string {
    return 'C';
  }

  getLeadRankByLeadScore(score: number): string {
    if (score < 20) return 'E';
    if (score < 60) return 'D';
    if (score < 70) return 'C';
    if (score < 80) return 'B';
    if (score < 90) return 'A';
    return 'G';
  }


  extractBusinessIdFromUrl(urlString: string): string | undefined {
    try {
      // Handle relative/partial URLs safely by giving a dummy base if needed
      const url = new URL(urlString, 'https://placeholder.invalid');
      const bid = url.searchParams.get('bid');
      return isNotBlank(bid) ? bid ?? '' : undefined;
    } catch (ex) {
      console.error('Exception while fetching Business from Click Url', ex);
      return undefined;
    }
  }

  async getBusinessNumber(contactRequest: IContactRequest): Promise<string | undefined> {
    let businessNumber = contactRequest.businessNumber;

    if (!isNotBlank(businessNumber) && isNotBlank(contactRequest.clickUrl)) {
      businessNumber = this.extractBusinessIdFromUrl(contactRequest.clickUrl ?? '');
      if (isNotBlank(businessNumber)) {
        console.info(`Business Number fetched from click url is ${businessNumber} for emailId ${contactRequest.emailId}`);
      }
    }

    return businessNumber;
  }

  capitalizeBusinessName(businessName?: string): string {
    if (!businessName) return '';
    return businessName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  leadSfdcCampaignComment(contactRequest: IContactRequest): void {
    if (isNotBlank(contactRequest.leadSfdcCampaign)) {
      const existing = isNotBlank(contactRequest.comments) ? `${contactRequest.comments}\n` : '';
      contactRequest.comments = `${existing}LeadSfdcCampaign: ${contactRequest.leadSfdcCampaign}`;
    }
  }

  leadCrmInfoComment(contactRequest: IContactRequest): void {
    if (isNotBlank(contactRequest.crmInfo)) {
      const existing = isNotBlank(contactRequest.comments) ? `${contactRequest.comments}\n` : '';
      contactRequest.comments = `${existing}How they manage customer information? : ${contactRequest.crmInfo}`;
    }
  }

  partnerFormComment(contactRequest: IContactRequest): void {
    if (isNotBlank(contactRequest.comments)) {
      contactRequest.comments = normalizeString(contactRequest.comments);
    }
  }

  getNormalizedString(value: string): string {
    return normalizeString(value);
  }

  getTrimmedLeadCampaignToUpdateSFDCLead(value: string): string {
    if (!value) return value;
    return value.length > MAX_CAMPAIGN_LENGTH ? value.substring(0, MAX_CAMPAIGN_LENGTH) : value;
  }

  getTrimmedLeadContentToUpdateSFDCLead(value: string): string {
    if (!value) return value;
    return value.length > MAX_CONTENT_LENGTH ? value.substring(0, MAX_CONTENT_LENGTH) : value;
  }

  getTrimmedLeadMediumToUpdateSFDCLead(value: string): string {
    if (!value) return value;
    return value.length > MAX_MEDIUM_LENGTH ? value.substring(0, MAX_MEDIUM_LENGTH) : value;
  }

  validateCampaignIdInput(campaignId?: string): string | undefined {
    if (!campaignId) return undefined;
    const regex = /^[a-zA-Z0-9]{15,18}$/;
    return regex.test(campaignId) ? campaignId : undefined;
  }

  async triggerReputationGapAsync(leadId: string): Promise<void> {
    const url = `${env.growth.baseUrl}${APIEndpoints.REPUTATION_GAP_SYNC_TRIGGER}?leadId=${encodeURIComponent(leadId)}`;

    try {
      await createAPICall(url, 'POST', constructHttpHeader());
      console.log(`[Growth] Triggered Reputation Gap API for leadId ${leadId}, URL: ${url}`);
    } catch (error) {
      console.error(`[Growth] Async error while triggering reputation-gap for leadId ${leadId}`, error);
    }
  }

  triggerReputationGapAnalysisReport(leadId: string): string {
    this.triggerReputationGapAsync(leadId);
    return `Please find the market & reputation gap analysis report here: https://success.birdeye.com/#/lead-insight?rid=${leadId}`;
  }

  async createBusinessAggregation(business: IBusiness, requestMessage: IContactRequest, envFlag: string): Promise<void> {
    try {
      let bizAggUri: string | undefined;
      let bizAggRequest: string | undefined;
      const freeTrial = BazaarifyConstants.PAID.toLowerCase() === envFlag.toLowerCase() && isNotBlank(requestMessage.profileUrl);

      if (isNotBlank(requestMessage.profileUrl)) {
        try {
          const source = await this.aggregationSourceRepository.findById(BazaarifyConstants.GOOGLE_SOURCE_ID);

          bizAggUri = this.getCreateBusinessAggregationUrl(envFlag);

          const createAggregationInputMessage: ICreateAggregationInputMessage = { sourceId: BazaarifyConstants.GOOGLE_SOURCE_ID, url: requestMessage.profileUrl, profileId: requestMessage.placeId, sourceAlias: source?.source_alias };
          const bizAggRequestObject: IBusinessAggregationRequest = { inputMessage: createAggregationInputMessage, skipProfiling: false };

          console.log(`Going to send request for business aggregation, businessId :${business.id}, request :${JSON.stringify(bizAggRequestObject)}`);
          bizAggRequest = JSON.stringify(bizAggRequestObject);

          const headers = { ...constructHttpHeader(), 'business-id': String(business.id) };
          const bizAggResponse = await createAPICall<string>(bizAggUri, 'POST', headers, bizAggRequestObject);

          console.log(`Business aggregation request successfully sent, businessId :${business.id}, request :${bizAggRequest}, response :${bizAggResponse}`);
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 400) {
            console.warn(`Exception while sending Business aggregation request, businessId :${business.id}, request :${bizAggRequest}, uri :${bizAggUri}`, e);
          } else {
            console.error(`Exception while sending Business aggregation request, businessId :${business.id}, request :${bizAggRequest}, uri :${bizAggUri}`, e);
          }
        }
      }

      const businessFindRequestBAM: IBusinessFindRequestBAM = { businessId: business.id, contactRequestId: requestMessage.id, isFreeTrial: freeTrial, skipDataAggregation: false };
      await this.submitFindRequest(businessFindRequestBAM, envFlag, null);
    } catch (e) {
      console.error(`Exception while creation requesting Business Aggregation through API call for businessNumber: ${requestMessage.businessNumber}, reason:`, e);
    }
  }

  private async submitFindRequest(businessFindRequestBAM: IBusinessFindRequestBAM, envFlag: string, region: string | null): Promise<void> {
    const uri = this.getFindRequestUrl(envFlag, region);
    try {
      console.log(`Find request received for business id ${businessFindRequestBAM.businessId}`);
      const response = await createAPICall<string>(uri, 'POST', constructHttpHeader(), businessFindRequestBAM);
      console.log(`Response received for find request : ${response}, business id : ${businessFindRequestBAM.businessId}, uri : ${uri}`);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400) {
        console.warn(`Exception while making find request for business id : ${businessFindRequestBAM.businessId}, uri : ${uri}, exception :`, e);
      } else {
        console.error(`Exception while making find request for business id : ${businessFindRequestBAM.businessId}, uri : ${uri}, exception :`, e);
      }
    }
  }

  private resolveBamEndpoint(envFlag: string, region: string | null): string {
    if (isNotBlank(region) && LeadGenConstants.EU.toLowerCase() === region!.toLowerCase()) {
      return env.bam.paidEndpointEu;
    }
    if (BazaarifyConstants.FREE.toLowerCase() === envFlag.toLowerCase()) {
      return env.bam.freeEndpoint;
    }
    return env.bam.paidEndpoint;
  }

  private getFindRequestUrl(envFlag: string, region: string | null): string {
    const bamEndpoint = this.resolveBamEndpoint(envFlag, region);
    return `${bamEndpoint}${APIEndpoints.FIND_BUSINESS}`;
  }

  private getCreateBusinessAggregationUrl(envFlag: string): string {
    const bamEndpoint = BazaarifyConstants.PAID.toLowerCase() === envFlag.toLowerCase() ? env.bam.paidEndpoint : env.bam.freeEndpoint;
    return `${bamEndpoint}${APIEndpoints.CREATE_BUSINESS_AGGREGATION}`;
  }
}
