import { ISFDCLeadOperationHelper } from '../interfaces/sfdc-lead-operation.helper.interface';
import { ILead, IContact } from '../../types/sfdc-lead.types';
import { createAPICall, constructHttpHeaderWithServiceName } from '../../utils/http.util';
import { APIEndpoints, SFDCQueryParamConstants } from '../../config/constants';
import { env } from '../../config/env';
import { SfdcResponse } from '../../types/calendar.types';
import { SFDCLeadStatus } from '../../types/enums';
import { LeadCache } from '../../cache/lead.cache';

const SFDC_LEAD_SAVE_FAILURE_MESSAGE = "[Urgent] Lead Operation Failure - ";
const SFDC_OPERATION_CREATE = "Create";
export class SFDCLeadOperationHelper implements ISFDCLeadOperationHelper {
  constructor(private readonly leadCache: LeadCache) {}
  async callToCreateNewSFDCLeadAndCacheIt(leadRequest: ILead): Promise<string> {
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_CREATE_LEAD_ENDPOINT}`;
    let requestBody: string | undefined;

    try {
      console.log(`Creating new lead in SFDC, emailId: ${leadRequest.Email}, requestBody: ${JSON.stringify(leadRequest)}`);

      requestBody = JSON.stringify(leadRequest);

      const response = await createAPICall<Record<string, unknown>>(url, 'POST', constructHttpHeaderWithServiceName(), leadRequest);

      const leadId = String(response?.id).trim();

      await this.leadCache.cacheLeadIdByEmail(leadRequest.Email!, leadId);

      console.log(`Lead created successfully, leadId: ${leadId}, emailId: ${leadRequest.Email}, requestBody: ${requestBody}, url: ${url}`);

      return leadId;
    } catch (e) {
      console.error(`${SFDC_LEAD_SAVE_FAILURE_MESSAGE}${SFDC_OPERATION_CREATE}, leadId: ${leadRequest.Id}, emailId: ${leadRequest.Email}, uri: ${url}, requestBody: ${requestBody}`, e);

      await this.leadCache.removeLeadIdByEmail(leadRequest.Email!);
      throw e;
    }
  }

  async callToUpdateSFDCLead(lead: ILead, existingLeadStatus: string | null): Promise<void> {
    if (!existingLeadStatus?.includes(SFDCLeadStatus.DOWNGRADE)) {
      const hasOwnerAndNew =
        !!lead.OwnerId &&
        lead.OwnerId !== env.sfdc.defaultOwnerId &&
        lead.Status === SFDCLeadStatus.NEW;

      if (!hasOwnerAndNew) {
        lead.Status = undefined;
      }
    }

    const leadId = lead.Id;
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_UPDATE_LEAD_ENDPOINT}?id=${encodeURIComponent(leadId ?? '')}`;
    const { Id, ...leadPayload } = lead;

    try {
      console.log(`[SFDC] Updating lead in SFDC, leadId: ${leadId}, emailId: ${lead.Email}, leadObjectToUpdate: ${JSON.stringify(leadPayload)}`);

      await createAPICall(url, 'PUT', constructHttpHeaderWithServiceName(), leadPayload);

      console.log(`[SFDC] Lead updated successfully, leadId: ${leadId}, emailId: ${lead.Email}, url: ${url}`);
    } catch (error) {
      console.error(`[SFDC] Lead save failure - UPDATE operation, leadId: ${leadId}, emailId: ${lead.Email}, url: ${url}`, error);

      if (lead.Email && lead.Email.trim() !== '') {
        this.leadCache.removeLeadIdByEmail(lead.Email);
      }

      throw error;
    }
  }


  async callToSearchLeadByEmail(email: string, returnFields: string): Promise<ILead | null> {
    const query = `select Id, email, ${returnFields} from Lead where email = '${email}'`;
    return this.getSfdcDetailsByQuery<ILead>(query);
  }

  async callToSearchLeadById(leadId: string, returnFields: string): Promise<ILead | null> {
    if (!leadId || leadId.trim() === '') {
      return null;
    }

    if (!this.isValidSalesforceId(leadId)) {
      throw new Error('Invalid Salesforce Lead ID');
    }

    const query = `select Id, ${returnFields} from Lead where Id = '${leadId}'`;
    return this.getSfdcDetailsByQuery<ILead>(query);
  }

  isValidSalesforceId(leadId: string | null | undefined): boolean {
    const SFDC_ID_PATTERN = /^([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})$/;
    return !!leadId && SFDC_ID_PATTERN.test(leadId!);
  }

  async callToGetExistingSFDCLead(leadId: string): Promise<ILead> {
    const startTime = Date.now();
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_GET_LEAD_ENDPOINT}?${APIEndpoints.SFDC_LEAD_ID_CONSTANT_IN_CREATE_API_REQUEST}=${encodeURIComponent(leadId)}`;

    try {
      const existingLead = await createAPICall<ILead>(url, 'GET', constructHttpHeaderWithServiceName(),);

      console.log('[SFDC] Retrieved lead successfully, leadId: %s, emailId: %s, url: %s', leadId, existingLead?.Email, url,);
      console.log('[SFDC] Time taken by callToGetExistingSFDCLead in ms: %d', Date.now() - startTime);

      return existingLead;
    } catch (error) {
      console.error(
        '[SFDC] Lead save failure - GET operation, leadId: %s, url: %s',
        leadId,
        url,
        error,
      );
      throw error; // rethrow, matching Java's `throws Exception`
    }
  }

  async callToSearchSFDCEntityByField(
    value: string,
    entity: string,
    field: string,
    returnField: string,
  ): Promise<string | null> {
    try {
      const url = `${env.bizApp.url}${APIEndpoints.SFDC_SEARCH_ENTITY_ENDPOINT}?value=${encodeURIComponent(value)}&entity=${entity}&field=${field}&returnField=${returnField}`;
      const response = await createAPICall<{ result?: string }>(
        url, 'GET', constructHttpHeaderWithServiceName(),
      );
      return response?.result ?? null;
    } catch {
      return null;
    }
  }

  async callToUpdateSfdcResource(
    resource: unknown,
    sfdcResource: string,
    sfdcResourceId: string,
    _region: string | null,
  ): Promise<void> {
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_UPDATE_RESOURCE_ENDPOINT}${sfdcResource}?id=${sfdcResourceId}`;
    await createAPICall(url, 'PUT', constructHttpHeaderWithServiceName(), resource);
  }

  async callToAddSFDCNote(leadId: string, title: string, body: string): Promise<void> {
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_ADD_NOTE_ENDPOINT}`;
    await createAPICall(url, 'POST', constructHttpHeaderWithServiceName(), { leadId, title, body });
  }

  async callToCreateSfdcResource(resource: unknown, sfdcResource: string): Promise<string> {
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_CREATE_RESOURCE_ENDPOINT}${sfdcResource}`;
    const response = await createAPICall<{ id?: string }>(
      url, 'POST', constructHttpHeaderWithServiceName(), resource,
    );
    return response?.id ?? '';
  }


  async getSfdcEntity(entityId: string, entity: string): Promise<string | null> {
    try {
      const url = `${env.bizApp.url}${APIEndpoints.SFDC_SEARCH_ENTITY_ENDPOINT}?${SFDCQueryParamConstants.ENTITY_ID}=${entityId}&${SFDCQueryParamConstants.CLASS_TYPE}=${entity}`;
      return await createAPICall<string>(url, 'GET', constructHttpHeaderWithServiceName());
    } catch {
      return null;
    }
  }

  async getSfdcDetailsByQuery<T>(query: string): Promise<T | null> {
    try {
      const url = `${env.bizApp.url}${APIEndpoints.SFDC_ACCOUNT_DETAILS_BY_CUSTOM_QUERY}?query=${encodeURIComponent(query)}`;

      const sfdcResponse = await createAPICall<SfdcResponse<T>>(
        url,
        'GET',
        constructHttpHeaderWithServiceName(),
      );

      if (sfdcResponse?.records && sfdcResponse.records.length > 0) {
        return sfdcResponse.records[0];
      }

      return null;
    } catch (error) {
      console.error(`[SFDC] Error while fetching sfdc details by query: ${query}`, error);
      return null;
    }
  }

  async executeSoqlQuery<T = unknown>(query: string): Promise<SfdcResponse<T> | null> {
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_ACCOUNT_DETAILS_BY_CUSTOM_QUERY}?${SFDCQueryParamConstants.QUERY}=${encodeURIComponent(query)}`;
    try {
      const response = await createAPICall<SfdcResponse<T>>(url, 'GET', constructHttpHeaderWithServiceName(), null);
      console.log(`SFDC Query Response from Biz app, query: ${query}, response: ${JSON.stringify(response)}`);
      return response ?? null;
    } catch (e) {
      console.error(`Exception while querying SFDC via Biz app: ${query}`, e);
      return null;
    }
  }

  async callToResetIndustry(lead: ILead): Promise<void> {
    if (!lead.Id) return;
    const url = `${env.bizApp.url}${APIEndpoints.SFDC_RESET_INDUSTRY}${lead.Id}`;
    await createAPICall(url, 'POST', constructHttpHeaderWithServiceName());
  }
}