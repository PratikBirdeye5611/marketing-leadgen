import { IValidatorUtilityService } from '../../interfaces/validation/validator-utility.service.interface';
import { IResultDto } from '../../../types/phone.types';
import { IBlacklistService } from '../../interfaces/validation/blacklist.service.interface';
import { IMailgunService } from '../../interfaces/validation/mailgun.service.interface';
import { IHunterService } from '../../interfaces/validation/hunter.service.interface';
import { ParametersConstants } from '../../../config/constants';
import { isValidIP } from '../../../utils/ip-address.util';
import { Knex } from 'knex';

const SFDC_USER_ID_REGEX = /^[a-zA-Z0-9]{15,18}$/;

export class ValidatorUtilityService implements IValidatorUtilityService {
  constructor(
    private readonly db: Knex,
    private readonly blacklistService: IBlacklistService,
    private readonly mailgunService: IMailgunService,
    private readonly hunterService: IHunterService,
  ) {}

  async validateEmailWithReason(emailId: string): Promise<IResultDto> {
    const result: IResultDto = { isValid: false };
    if (!emailId) return result;

    const normalized = emailId.toLowerCase();

    const isEmailBlacklisted = await this.blacklistService.isBlacklisted(normalized, false);
    if (isEmailBlacklisted) {
      result.isValid = false;
      result.reason = 'email is restricted';
      return result;
    }

    const domain = normalized.split('@')[1];
    if (domain) {
      const isDomainBlacklisted = await this.blacklistService.isBlacklisted(domain, true);
      if (isDomainBlacklisted) {
        result.isValid = false;
        result.reason = 'email contains restricted domain';
        return result;
      }
    }

    const mailgunResult = await this.mailgunService.validateEmail(normalized);
    if (mailgunResult.isValid) return mailgunResult;

    const hunterResult = await this.hunterService.validateEmail(normalized);
    hunterResult.reason = [mailgunResult.reason, hunterResult.reason]
      .filter(Boolean)
      .join('\n');
    return hunterResult;
  }

  async validateEmail(emailId: string): Promise<boolean> {
    const result = await this.validateEmailWithReason(emailId);
    return result.isValid;
  }

  async isBirdeyeDomain(emailId: string): Promise<boolean> {
    if (!emailId) return false;
    const input = emailId.toLowerCase().trim();
    const domain = input.split('@')[1];
    if (!domain) return false;

    let birdeyeDomains = ['birdeye.com', 'birdeye.org'];
    try {
      const row = await this.db('parameters')
        .where({ name: ParametersConstants.BIRDEYE_EMAIL_DOMAINS })
        .first();
      if (row?.value) {
        birdeyeDomains = row.value.split(',').map((d: string) => d.trim().toLowerCase());
      }
    } catch { }

    return birdeyeDomains.includes(domain);
  }

  async isSupportedValidCountry(countryCode: string): Promise<boolean> {
    if (!countryCode) return false;
    let supported = ['US', 'CA', 'AU', 'NZ', 'UK', 'GB', 'IE', 'NL', 'LU', 'BE', 'SE', 'NO', 'DK', 'FI', 'IS', 'SG', 'MY'];
    try {
      const row = await this.db('parameters')
        .where({ name: ParametersConstants.LEAD_SUPORTED_COUNTRY_CODES })
        .first();
      if (row?.value) {
        supported = row.value.split(',').map((c: string) => c.trim().toUpperCase());
      }
    } catch { }

    return supported.map((c) => c.toUpperCase()).includes(countryCode.toUpperCase());
  }

  isValidSfdcUserId(userId: string): boolean {
    if (!userId) return false;
    return SFDC_USER_ID_REGEX.test(userId);
  }
}
