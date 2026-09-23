export interface IBusiness {
  id?: number;
  updated?: Date;
  created?: Date;
  mail_resend_frequency?: number;
  last_scan_date?: Date;
  last_dup_check_date?: Date;
  reviews_scrapped?: number;
  business_id?: number;
  activation_status?: string;
  name?: string;
  phone?: string;
  fax?: string;
  email_id?: string;
  bazaarify_email_id?: string;
  website_url?: string;
  description?: string;
  keywords?: string;
  services?: string;
  logo_url?: string;
  review_agg_repeat_hours?: number;
}


export interface ICreateAggregationInputMessage {
  sourceId?: number;
  url?: string;
  profileId?: string;
  sourceAlias?: string;
}

export interface IBusinessAggregationRequest {
  inputMessage?: ICreateAggregationInputMessage;
  skipProfiling: boolean;
}

export interface IBusinessFindRequestBAM {
  businessId?: number;
  skipDataAggregation: boolean;
  contactRequestId?: number;
  isFreeTrial: boolean;
}