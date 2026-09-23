import { IContactRequest } from '../../types/contact-request.types';

export interface IContactRequestService {
  buildAndSaveContactRequest(
    contactRequest: IContactRequest,
    isPartialLeadForm: boolean,
  ): Promise<IContactRequestRecord>;

  findByContactRequestId(id: number): Promise<IContactRequestRecord | null>;

  blockAllPriorLeads(contactRequestId: number, emailId: string): Promise<void>;

  setExceptionMessageInContactRequest(
    prefix: string,
    contactRequestId: number,
    error: Error,
  ): Promise<void>;

  flushLeadCreationStatusInContactRequest(
    leadId: string,
    contactRequestId: number,
    leadCreatedStatus: number,
    emailId: string,
    existingLeadStatus?: string,
    sfdcContactId?: string,
  ): Promise<void>;

  getContactRequests(start: string, end: string): Promise<IContactRequestRecord[]>;
}

export interface IContactRequestRecord {
  id?: number;
  requestType?: string;
  formFillType?: string;
  visitId?: string;
  sessionId?: string;
  formFillId?: string;
  remoteIpAddress?: string;
  deviceName?: string;
  beCta?: string;
  experimentNames?: string;
  adClickId?: string;
  clickPageType?: string;
  leadPageType?: string;
  clickUrl?: string;
  leadUrl?: string;
  comments?: string;
  profileUrl?: string;
  errorMessage?: string;
  existingLeadStatus?: string;
  leadCreated?: number;
  skipLead?: boolean;
  fromGoogle?: number;
  aggregationCompleted?: number;
  createdAt?: Date;
  updatedAt?: Date;
  contacts?: IRequestContactsRecord;
  businessInfo?: IRequestBusinessInfoRecord;
  location?: IRequestLocationRecord;
  campaign?: IRequestCampaignRecord;
}

export interface IRequestContactsRecord {
  id?: number;
  contactRequestId?: number;
  firstName?: string;
  lastName?: string;
  emailId?: string;
  phone?: string;
  mobilePhone?: string;
}

export interface IRequestBusinessInfoRecord {
  id?: number;
  contactRequestId?: number;
  businessName?: string;
  businessPhone?: string;
  businessNumber?: string;
  businessLocations?: string;
  businessEmployees?: string;
  numberOfEmployees?: number;
  monthlyCustomers?: string;
  industry?: string;
  sourceIndustry?: string;
  annualRevenue?: number;
  monthlyExpenditure?: string;
  products?: string;
  productOfInterest?: string;
  locationsUnderManagement?: string;
  website?: string;
  businessEnv?: string;
  crmInfo?: string;
  crmName?: string;
  scanReportUrl?: string;
}

export interface IRequestLocationRecord {
  id?: number;
  contactRequestId?: number;
  zip?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  googleRating?: number;
  googleReviewCount?: number;
}

export interface IRequestCampaignRecord {
  id?: number;
  contactRequestId?: number;
  leadCampaign?: string;
  leadSubCampaign?: string;
  leadCampaignKw?: string;
  leadContent?: string;
  leadMedium?: string;
  leadSource?: string;
  leadSfdcCampaign?: string;
  intent?: string;
  buyingIntent?: string;
}

export interface ILeadsRecord {
  id?: number;
  contactRequestId?: number;
  sfdcLeadId?: string;
  sfdcContactId?: string;
  leadOwner?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILeadScoringRecord {
  id?: number;
  contactRequestId?: number;
  leadScore?: number;
  scoreColorCode?: string;
  scoreConfidence?: string;
  leadRank?: string;
}
