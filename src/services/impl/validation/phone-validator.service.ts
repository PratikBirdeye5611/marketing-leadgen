import { IPhoneValidatorService } from '../../interfaces/validation/phone-validator.service.interface';
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import { Knex } from 'knex';

const DEFAULT_SUPPORTED_COUNTRIES: CountryCode[] = [
  'US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'NL', 'LU',
  'BE', 'SE', 'NO', 'DK', 'FI', 'IS', 'SG', 'MY', 'MX',
];

export class PhoneValidatorService implements IPhoneValidatorService {
  constructor(private readonly db: Knex) {}

  async isValidPhoneNumberDemoRequest(phoneNo: string): Promise<boolean> {
    let countries: CountryCode[] = DEFAULT_SUPPORTED_COUNTRIES;
    try {
      const row = await this.db('parameters').where({ name: 'lead_supported_country_codes' }).first();
      if (row?.value) {
        countries = row.value.split(',').map((c: string) => c.trim().toUpperCase() as CountryCode);
      }
    } catch { }

    return countries.some((country) => this.isValidPhoneNumber(phoneNo, country));
  }

  isValidPhoneNumber(phoneNo: string, countryCode: string): boolean {
    try {
      const code = countryCode.toUpperCase() === 'UK' ? 'GB' : countryCode.toUpperCase();
      return isValidPhoneNumber(phoneNo, code as CountryCode);
    } catch {
      return false;
    }
  }

  formatPhoneToE164(phoneNo: string, countryCode: string): string {
    try {
      const code = countryCode.toUpperCase() === 'UK' ? 'GB' : countryCode.toUpperCase();
      const parsed = parsePhoneNumber(phoneNo, code as CountryCode);
      return parsed.format('E.164');
    } catch {
      return phoneNo;
    }
  }

  isPhoneMatch(phone1: string, phone2: string): boolean {
    const normalize = (p: string) => p.replace(/[^0-9]/g, '');
    return normalize(phone1) === normalize(phone2);
  }
}
