import { IMailgunService } from '../../interfaces/validation/mailgun.service.interface';
import { IResultDto } from '../../../types/phone.types';
import { createAPICall } from '../../../utils/http.util';
import { ParametersConstants } from '../../../config/constants';
import { env } from '../../../config/env';
import { Knex } from 'knex';

const DEFAULT_VALID_RESULTS = ['deliverable', 'catch_all', 'unknown'];
const DEFAULT_UNKNOWN_RESULTS = ['unknown'];
const DEFAULT_INVALID_REASONS = [
  'smtp_error', 'smtp_timeout', 'no_mx', 'No MX host found',
  'mailbox_does_not_exist', 'failed custom grammar check',
];

export class MailgunService implements IMailgunService {
  constructor(private readonly db: Knex) {}

  async validateEmail(emailId: string): Promise<IResultDto> {
    const result: IResultDto = { isValid: false };
    try {
      const validResults = await this.getParam(ParametersConstants.MAILGUN_VALID_RESULTS, DEFAULT_VALID_RESULTS);
      const unknownResults = await this.getParam(ParametersConstants.MAILGUN_UNKNOWN_RESULTS, DEFAULT_UNKNOWN_RESULTS);
      const invalidReasons = await this.getParam(ParametersConstants.MAILGUN_INVALID_REASONS, DEFAULT_INVALID_REASONS);

      const url = `${env.mailgun.uri}/address/validate?address=${encodeURIComponent(emailId)}&provider_lookup=true`;
      const basicAuth = Buffer.from(`${env.mailgun.username}:${env.mailgun.apiKey}`).toString('base64');
      const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      };

      const response = await createAPICall<{ result?: string; reason?: string[] }>(
        url, 'GET', headers,
      );

      if (!response) {
        result.isValid = false;
        result.reason = 'No response from Mailgun';
        return result;
      }

      const isUnknown = unknownResults.some(
        (r) => r.toLowerCase() === response.result?.toLowerCase(),
      );
      const hasInvalidReason = (response.reason ?? []).some((r) =>
        invalidReasons.some((ir) => ir.toLowerCase() === r.toLowerCase()),
      );

      if (isUnknown && hasInvalidReason) {
        result.isValid = false;
        result.reason = `Mailgun unknown with invalid reasons: ${JSON.stringify(response)}`;
      } else if (validResults.some((r) => r.toLowerCase() === response.result?.toLowerCase())) {
        result.isValid = true;
        result.reason = `Mailgun valid: ${JSON.stringify(response)}`;
      } else {
        result.isValid = false;
        result.reason = `Mailgun invalid: ${JSON.stringify(response)}`;
      }
    } catch {
      result.isValid = false;
      result.reason = 'Mailgun API error';
    }
    return result;
  }

  private async getParam(name: string, defaultValue: string[]): Promise<string[]> {
    const row = await this.db('parameters').where({ name }).first();
    return row?.value ? row.value.split(',') : defaultValue;
  }
}
