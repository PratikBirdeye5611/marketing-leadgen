import { IMarketoService } from '../interfaces/marketo.service.interface';
import { IContactRequest } from '../../types/contact-request.types';
import {
  IMarketoUserDetailsResponse,
  IMarketoCreateOrUpdateUserResponse,
  IMarketoAddToListResponse,
} from '../../types/marketo.types';
import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { ParametersConstants } from '../../config/constants';
import { env } from '../../config/env';
import { Knex } from 'knex';

export class MarketoService implements IMarketoService {
  constructor(private readonly db: Knex) {}

  async submitDemoRequestToMarketo(
    contactRequest: IContactRequest,
    isPartialLead: boolean,
  ): Promise<void> {
    const isEnabled = await this.isMarketoEnabled();
    if (!isEnabled || contactRequest.skipMarketoProcess) return;

    const url = `${env.marketo.baseUrl}/api/lead/submit`;
    await createAPICall(url, 'POST', constructHttpHeader(), {
      ...contactRequest,
      isPartialLead,
    });
  }

  async getMarketoUser(
    email: string,
    _retryCount: number,
  ): Promise<IMarketoUserDetailsResponse | null> {
    try {
      const url = `${env.marketo.baseUrl}/api/lead/find?email=${encodeURIComponent(email)}`;
      return await createAPICall<IMarketoUserDetailsResponse>(url, 'GET', constructHttpHeader());
    } catch {
      return null;
    }
  }

  async addMarketoUser(
    email: string,
    _retryCount: number,
  ): Promise<IMarketoCreateOrUpdateUserResponse | null> {
    try {
      const url = `${env.marketo.baseUrl}/api/lead/create`;
      return await createAPICall<IMarketoCreateOrUpdateUserResponse>(
        url, 'POST', constructHttpHeader(), { email },
      );
    } catch {
      return null;
    }
  }

  async addMarketoUserToList(
    marketoId: number,
    _retryCount: number,
    listId: string,
  ): Promise<IMarketoAddToListResponse | null> {
    try {
      const url = `${env.marketo.baseUrl}/api/list/add`;
      return await createAPICall<IMarketoAddToListResponse>(
        url, 'POST', constructHttpHeader(), { marketoId, listId },
      );
    } catch {
      return null;
    }
  }

  private async isMarketoEnabled(): Promise<boolean> {
    try {
      const row = await this.db('parameters')
        .where({ name: ParametersConstants.MARKETO_ENABLED })
        .first();
      return row?.value === 'true';
    } catch {
      return false;
    }
  }
}
