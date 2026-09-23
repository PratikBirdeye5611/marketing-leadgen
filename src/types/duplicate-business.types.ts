export interface IDuplicateBusinessRequest {
  placeId?: string;
  name?: string;
  phone?: string;
  zip?: string;
  env?: number;
  domain?: string;
  businessTypes?: string[];
  enterpriseId?: number;
  count?: number;
  groupType?: string;
}

export interface IBusinessESResponse {
  name?: string;
  businessId?: number;
  businessNumber?: number;
  env?: number;
  websiteUrl?: string;
  logoUrl?: string;
  profileUrl?: string;
  activationStatus?: string;
  enterpriseId?: number;
}

export interface ISearchBusinessResponse {
  businesses?: IBusinessESResponse[];
}