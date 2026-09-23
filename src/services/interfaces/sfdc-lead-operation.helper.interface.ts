import { SfdcResponse } from '../../types/calendar.types';
import { ILead, IContact } from '../../types/sfdc-lead.types';

export interface ISFDCLeadOperationHelper {
  callToCreateNewSFDCLeadAndCacheIt(lead: ILead): Promise<string>;

  callToUpdateSFDCLead(lead: ILead, existingLeadStatus: string | null): Promise<void>;

  callToSearchLeadByEmail(emailId: string, returnFields: string): Promise<ILead | null>;

  callToGetExistingSFDCLead(leadId: string): Promise<ILead | null>;

  callToSearchSFDCEntityByField(
    value: string,
    entity: string,
    field: string,
    returnField: string,
  ): Promise<string | null>;

  callToUpdateSfdcResource(
    resource: unknown,
    sfdcResource: string,
    sfdcResourceId: string,
    region: string | null,
  ): Promise<void>;

  callToAddSFDCNote(leadId: string, title: string, body: string): Promise<void>;

  callToCreateSfdcResource(resource: unknown, sfdcResource: string): Promise<string>;

  callToSearchLeadById(leadId: string, returnFields: string): Promise<ILead | null>;

  getSfdcEntity(entityId: string, entity: string): Promise<string | null>;

  getSfdcDetailsByQuery<T>(query: string): Promise<T | null>;

  callToResetIndustry(lead: ILead): Promise<void>;

  executeSoqlQuery<T = unknown>(query: string): Promise<SfdcResponse<T> | null>;
}
