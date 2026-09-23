import { ILocationMessage } from './signup.types';

export interface IBusinessHourMessage {
  day?: string;
  openTime?: string;
  closeTime?: string;
}

export interface IBusinessUpdateDto {
  name?: string;
  alias?: string;
  emailId?: string;
  phone?: string;
  description?: string;
  websiteUrl?: string;
  location?: ILocationMessage;
  isClaimed?: number;
  working24x7?: number;
  hoursOfOperations?: IBusinessHourMessage[];
  categoryList?: string[];
  wholeWeekOperating?: number;
  timezone?: string;
  isSEOEnabled?: string;
}

export interface ILocationBusinessDto {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  countryCode?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
  lat?: string;
  lng?: string;
  geotLocation?: string;
}

export interface IInternalListing {
  description?: string;
  subcategory1?: string;
  subcategory2?: string;
  subcategory3?: string;
  displayCategory?: string;
}

export interface IUpdateBusinessRequest {
  name?: string;
  location?: ILocationBusinessDto;
  timezone?: string;
  languages?: string[];
  working24x7?: number;
  products?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  internalListing?: IInternalListing;
  description?: string;
}