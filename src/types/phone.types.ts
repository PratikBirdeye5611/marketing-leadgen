export interface IPhoneValidationDto {
  countryCode?: string;
  carrierType?: string;
  failureReason?: string;
  phoneNumber?: string;
  nationalFormat?: string;
}

export interface IResultDto {
  isValid: boolean;
  reason?: string;
}

export interface IMailgunResponse {
  result?: string;
  reason?: string[];
  is_disposable_address?: boolean;
  is_role_address?: boolean;
}

export interface IHunterData {
  status?: string;
  score?: number;
  email?: string;
}

export interface IHunterResponse {
  data?: IHunterData;
}
