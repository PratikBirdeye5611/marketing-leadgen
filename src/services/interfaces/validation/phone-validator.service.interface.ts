export interface IPhoneValidatorService {
  isValidPhoneNumberDemoRequest(phoneNo: string): Promise<boolean>;

  isValidPhoneNumber(phoneNo: string, countryCode: string): boolean;

  formatPhoneToE164(phoneNo: string, countryCode: string): string;

  isPhoneMatch(phone1: string, phone2: string): boolean;
}
