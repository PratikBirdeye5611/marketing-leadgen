import { FormFillType, LeadRank, RequestType } from './enums';

export interface IContactRequest {
  id?: number;
  createdAt?: Date;
  webSubmitDateTime?: Date;
  logSearchKey?: string;

  name?: string;
  firstName?: string;
  lastName?: string;
  emailId?: string;
  encryptedLeadEmailId?: string;
  phone?: string;
  encryptedLeadPhone?: string;
  mobilePhone?: string;
  title?: string;
  department?: string;
  seniority?: string;

  businessName?: string;
  businessPhone?: string;
  businessNumber?: string;
  businessLocations?: string;
  businessEmployees?: string;
  numberOfEmployees?: number;
  monthlyCustomers?: string;
  annualRevenue?: number;
  locationsUnderManagement?: string;
  customerMonthlyExpenditure?: string;
  productToSell?: string[];
  productOfInterest?: string[];
  website?: string;
  businessEnv?: string;
  crmInfo?: string;
  crmName?: string;

  street?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;

  fromGoogle?: number;
  profileUrl?: string;
  googleReviewCount?: number;
  googleRating?: number;

  leadCampaign?: string;
  leadSubCampaign?: string;
  leadCampaignKW?: string;
  leadContent?: string;
  leadMedium?: string;
  leadSource?: string;
  leadSfdcCampaign?: string;
  intent?: string;
  buyingIntent?: string;
  clickUrl?: string;
  leadUrl?: string;
  clickPageType?: string;
  leadPageType?: string;

  zohoLeadId?: string;
  sfdcLeadId?: string;
  sfdcContactId?: string;
  leadOwner?: string;
  leadAutoAssignment?: boolean;
  existingLeadStatus?: string;
  original_Lead__c?: string;

  leadScore?: number;
  scoreColorCode?: string;
  scoreConfidence?: string;
  leadRank?: LeadRank;
  leadStage?: string;

  zoominfoProfile?: string;
  zoominfoProcessed?: number;
  zoomInfoIndustry?: string;

  industry?: string;
  sourceIndustry?: string;
  subIndustry1?: string;

  scanReportUrl?: string;

  requestType?: RequestType;
  formFillType?: FormFillType;
  formFillId?: string;
  visitId?: string;
  sessionId?: string;
  remoteIp?: string;
  deviceName?: string;
  beCta?: string;
  adClickId?: string;
  croExperiments?: string[];

  pageURL?: string;
  slug?: string;
  eventDate?: string;
  eventEndDate?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  duration?: string;
  meetingId?: string;
  calendarEventId?: string;
  organiserEmailId?: string;
  calendarEventHtmlLink?: string;
  salesRepEmailIds?: string[];
  additionalAttendees?: string[];
  userMessage?: string;
  audienceUrl?: string;
  audienceKey?: string;
  webinarId?: string;

  skipLead?: boolean;
  skipEmailValidation?: boolean;
  skipPhoneValidation?: boolean;
  skipBusinessNameValidation?: boolean;
  skipLeadLimitValidation?: boolean;
  skipZoomInfoProcess?: boolean;
  skipMarketoProcess?: boolean;
  freemiumRequest?: boolean;
  supportSkipLead?: boolean;
  forcefulLead?: boolean;
  upsellRequest?: boolean;
  amRequest?: boolean;
  futureWebinar?: boolean;

  comments?: string;
  remoteIpCountryName?: string;
  remoteIpCountryIsoCode?: string;
  referralCode?: string;
  searchAiReportId?: string;
}
