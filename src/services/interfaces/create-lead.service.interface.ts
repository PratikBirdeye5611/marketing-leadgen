import { IContactRequest } from '../../types/contact-request.types';
import { ILead } from '../../types/sfdc-lead.types';

export interface ICreateLeadService {
  businessLeadAndCreateEvent(contactRequest: IContactRequest): Promise<void>;

  leadCreationAndFollowingOperations(contactRequest: IContactRequest): Promise<void>;

  pushSFDCLead(contactRequest: IContactRequest): Promise<string>;

  createLeadRecord(contactRequest: IContactRequest, isRetriedLead: boolean): Promise<string>;

  searchAndSetSFDCLeadByEmail(contactRequest: IContactRequest): Promise<ILead | null>;

  updateLeadDescription(leadId: string, newContent: string, append: boolean): Promise<void>;

  filterLeadRequest(lead: ILead): Promise<void>;
}
