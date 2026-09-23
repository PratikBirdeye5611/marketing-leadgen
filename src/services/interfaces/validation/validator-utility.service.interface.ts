import { IResultDto } from '../../../types/phone.types';

export interface IValidatorUtilityService {
  validateEmailWithReason(emailId: string): Promise<IResultDto>;

  validateEmail(emailId: string): Promise<boolean>;

  isBirdeyeDomain(emailId: string): Promise<boolean>;

  isSupportedValidCountry(countryCode: string): Promise<boolean>;

  isValidSfdcUserId(userId: string): boolean;
}
