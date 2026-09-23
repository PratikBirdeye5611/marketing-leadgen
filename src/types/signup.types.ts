export interface ILocationMessage {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  countryCode?: string;
  countryName?: string;
  lat?: string;
  lng?: string;
}

export interface ISignupInputMessage {
  businessName?: string;
  businessEmailId?: string;
  phone?: string;
  zip?: string;
  type?: string;
  countryCode?: string;
  competitorId?: number;
  repEmail?: string;
  ownerId?: string;
  businessLocations?: string;
  businessEmployees?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  repName?: string;
  userFirstName?: string;
  userLastName?: string;
  userPhone?: string;
  userName?: string;
  userEmailId?: string;
  userPassword?: string;
  userRole?: string;
  isCorporate?: number;
  status?: string;
  aggrOptions?: number;
  businessIds?: number[];
  tradeshowName?: string;
  affiliateName?: string;
  industryName?: string;
  salesRep?: number;
  leadRank?: string;
  requestType?: string;
  leadCampaign?: string;
  leadSubCampaign?: string;
  leadCampaignKW?: string;
  clickUrl?: string;
  leadUrl?: string;
  isFreeTrial?: boolean;
  latitude?: number;
  longitude?: number;
  subIndustryNames?: string[];
  location?: ILocationMessage;
  activationStatus?: string;
  groupType?: string;
  websiteUrl?: string;
  placeId?: string;
  industry?: string;
}

export interface ISignupOutputMessage {
  businessId?: number;
  userId?: number;
  name?: string;
  sessionToken?: string;
  templateid?: number;
  isAggregationRequired?: number;
  type?: string;
  businessNumber?: number;
  competitorAccId?: number;
  businessAlreadyPresent?: boolean;
  sfdcAccountId?: string;
  sfdcOpportunityId?: string;
}