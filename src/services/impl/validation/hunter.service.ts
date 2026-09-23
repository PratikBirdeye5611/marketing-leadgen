import { IHunterService } from '../../interfaces/validation/hunter.service.interface';
import { IResultDto } from '../../../types/phone.types';
import { createAPICall, constructHttpHeader } from '../../../utils/http.util';
import { ParametersConstants } from '../../../config/constants';
import { env } from '../../../config/env';
import { Knex } from 'knex';

const DEFAULT_VALID_STATUS = ['valid', 'accept_all', 'webmail'];

export class HunterService implements IHunterService {
  constructor(private readonly db: Knex) {}

  async validateEmail(emailId: string): Promise<IResultDto> {
    const result: IResultDto = { isValid: true };
    try {
      const validStatus = await this.getParam(ParametersConstants.HUNTER_VALID_STATUS, DEFAULT_VALID_STATUS);
      const url = `${env.hunter.uri}email-verifier?email=${encodeURIComponent(emailId)}&api_key=${env.hunter.apiKey}`;
      const response = await createAPICall<{ data?: { status?: string } }>(
        url, 'GET', constructHttpHeader(),
      );

      if (!response?.data) {
        result.isValid = true;
        result.reason = 'No response from Hunter';
        return result;
      }

      if (validStatus.some((s) => s.toLowerCase() === response.data?.status?.toLowerCase())) {
        result.isValid = true;
        result.reason = `Hunter valid: ${response.data.status}`;
      } else {
        result.isValid = false;
        result.reason = `Hunter invalid: ${response.data.status}`;
      }
    } catch {
      result.isValid = true;
      result.reason = 'Hunter API error - defaulting to valid';
    }
    return result;
  }

  private async getParam(name: string, defaultValue: string[]): Promise<string[]> {
    const row = await this.db('parameters').where({ name }).first();
    return row?.value ? row.value.split(',') : defaultValue;
  }
}
