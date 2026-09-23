export interface IBusinessLiteDto {
  businessId?: number;
  businessNumber?: number;
  businessName?: string;
  activationStatus?: string;
  phone?: string;
  emailId?: string;
  accountType?: string;
  created?: string;
  locationId?: number;
  enterpriseId?: number;
  enterpriseNumber?: number;
  type?: string;
}

export interface IBusinessOptions {
  smsOpted?: number;
  mmsOpted?: number;
  presenceOpted?: number;
  sendgridAPIUser?: string;
  sendgridAPIPassword?: string;
  isSourceLogoEnabled?: number;
  hideRatingAndCount?: number;
  skipDeeplinkLandingPage?: number;
  showContactReviewerFlag?: number;
  businessInfoLayout?: number;
  enableROIReport?: number;
  skipDeletion?: number;
  categoryLinkEnabled?: number;
  isCorporate?: number;
  enableSmsDeeplinkForEmail?: number;
  disabledAttribution?: number;
  termsUrl?: string;
  privacyUrl?: string;
  supportTicketingEnabled?: number;
  isdefaultinsightclustersenable?: number;
  organicReviewSourceName?: string;
  enableMessenger?: number;
  enableAutoResponse?: number;
  reviewerAttributionEnabled?: number;
  bulkCustomEmail?: number;
  liveChat?: number;
  isVideoEnabled?: number;
  isEmailViaInboxEnabled?: number;
  enableRobinReport?: number;
  paymentEnabled?: number;
  secureReviewFlow?: number;
}