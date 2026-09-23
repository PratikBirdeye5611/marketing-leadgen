export interface IListingScanRequest {
  businessId?: number;
  bId?: number;
  businessName?: string;
  phone?: string;
  zip?: string;
  address?: string;
  googleIndustry?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  partnerId?: number;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userPhone?: string;
  websiteUrl?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  countryName?: string;
  type?: string;
  scanType?: string;
  scanRequestId?: string;
  lenTau?: boolean;
}

export interface IScanCheck {
  businessName?: string;
  phone?: string;
  zip?: string;
  countryCode?: string;
  placeId?: string;
}

export interface IScanCheckResponse {
  createLead: boolean;
  businessId?: number;
  businessNumber?: number;
  showCta?: boolean;
  accountType?: string;
  presenceOpted?: number;
  activationStatus?: string;
  env?: string;
  locationId?: number;
  region: string;
}

export interface IScanResponseDto {
  createLead?: boolean;
  scanRequestId?: string;
  businessNumber?: number;
  onlineListingsUrl?: string;
}

export interface IValidateScanResponse {
  showCta: boolean;
  businessName?: string;
  onlineListingUrl?: string;
}

export interface IListingScanResponse {
  status?: string;
}

export interface IOverview {
  onlineScore?: number;
  businessName?: string;
  phone?: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  emailId?: string;
  businessNumber?: number;
  city?: string;
  state?: string;
  countryCode?: string;
  countryName?: string;
  zip?: string;
  userFirstName?: string;
  userLastName?: string;
  industryKeyword?: string;
  maskedEmail?: string;
}

export interface IInfoCount {
  nameCount: number;
  addressCount: number;
  phoneCount: number;
}

export interface IVoiceSearch {
  apple: number;
  alexa: number;
  microsoft: number;
}

export interface IListing {
  sourceId: number;
  aggregationSourceId: number;
  sourceName?: string;
  name?: string;
  address?: string;
  phone?: string;
  status?: string;
  statusMessage?: string;
  live_url?: string;
  matchName: number;
  matchPhone: number;
  matchAddress: number;
}

export interface IListingData {
  accuracyScore?: number;
  totalCount?: number;
  matchCount?: number;
  voiceSearch?: IVoiceSearch;
  infoCount?: IInfoCount;
  listings?: IListing[];
}

export interface IMarker {
  lat?: number;
  lon?: number;
  locRanking?: string[];
}

export interface ILocation {
  name?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
}

export interface ILocalRanking {
  accuracyScore?: number;
  totalRank?: number;
  markers?: Record<string, IMarker>;
  searchedBusiness?: string;
  locations?: Record<string, ILocation>;
}

export interface IReview {
  author_name?: string;
  author_url?: string;
  language?: string;
  relative_time_description?: string;
  profile_photo_url?: string;
  text?: string;
  rating?: number;
}

export interface IReputation {
  rating?: number;
  totalCount?: number;
  industryRating?: number;
  industryCount?: number;
  industryName?: string;
  reviews?: IReview[];
}

export interface IRatingSummary {
  star?: number;
  count?: number;
}

export interface ISummary {
  status?: string;
  reviewCountPastMonth?: string;
  reviewRespondedPercentage?: string;
  reputationScore?: string;
  improvementScore?: string;
  ratingSummary?: IRatingSummary[];
  oldestReviewDate?: string;
}

export interface IFilteredLocalRanking {
  searchedBusiness?: string;
  locationKey?: string;
  businessName?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
}

export interface IData {
  overview?: IOverview;
  listing?: IListingData;
  localRanking?: ILocalRanking;
  reputation?: IReputation;
  summary?: ISummary;
  filteredLocalRanking?: IFilteredLocalRanking[];
}

export interface IScanToolResponse {
  status?: string;
  error?: string;
  data?: IData;
}

export interface IDomainMessage {
  domain?: string;
  secureEnabled?: number;
}