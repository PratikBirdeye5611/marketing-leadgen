import { IBusiness } from '../../types/business.types';
import { IContactRequest } from '../../types/contact-request.types';
import { ILead } from '../../types/sfdc-lead.types';

export interface ILeadGenHelper {
  fetchAndSetCountryDetails(contactRequest: IContactRequest): Promise<void>;

  getLeadRankByIndustry(industry?: string): string;

  getLeadRankByLeadScore(score: number): string;

  getBusinessNumber(contactRequest: IContactRequest): Promise<string | undefined>;

  capitalizeBusinessName(businessName?: string): string;

  leadSfdcCampaignComment(contactRequest: IContactRequest): void;

  leadCrmInfoComment(contactRequest: IContactRequest): void;

  partnerFormComment(contactRequest: IContactRequest): void;

  getNormalizedString(value: string): string;

  getTrimmedLeadCampaignToUpdateSFDCLead(value: string): string;

  getTrimmedLeadContentToUpdateSFDCLead(value: string): string;

  getTrimmedLeadMediumToUpdateSFDCLead(value: string): string;

  validateCampaignIdInput(campaignId?: string): string | undefined;

  triggerReputationGapAnalysisReport(leadId: string): string;
  
  createBusinessAggregation(business: IBusiness, requestMessage: IContactRequest, envFlag: string): Promise<void>
}
