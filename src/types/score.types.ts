export interface IColorCode {
  red?: number;
  green?: number;
  blue?: number;
}

export interface IScoreDto {
  score: number;
  colorCode?: IColorCode;
  isUncertain?: boolean;
}

export interface ILeadScoreRequest {
  emailId?: string;
  businessName?: string;
  industry?: string;
  country?: string;
  countryCode?: string;
  numberOfEmployees?: number;
  annualRevenue?: number;
  businessLocations?: string;
  fromGoogle?: number;
  leadSource?: string;
  leadCampaign?: string;
  leadSubCampaign?: string;
  requestType?: string;
}

export interface IAccountScoreRequest {
  businessId?: number;
  industry?: string;
  country?: string;
  numberOfEmployees?: number;
  annualRevenue?: number;
}

export interface IRetentionScoreRequest {
  businessId?: number;
  industry?: string;
  country?: string;
}
