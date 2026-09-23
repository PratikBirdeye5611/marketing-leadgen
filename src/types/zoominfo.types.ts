export interface IZoomInfoContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  profile?: string;
  country?: string;
}

export interface IZoomInfoCompany {
  name?: string;
  website?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  zipCode?: string;
  country?: string;
  employeeCount?: number;
  locationCount?: number;
}

export interface IEnrichResultDto {
  contact?: IZoomInfoContact;
  company?: IZoomInfoCompany;
}
