import { IContactRequest } from '../../types/contact-request.types';
import { ILead, IContact } from '../../types/sfdc-lead.types';

export interface ISFDCLeadRequestBuilder {
  buildLeadRequest(contactRequest: IContactRequest, existingLead: ILead | null): ILead;

  requestToUpdateSFDCLead(contactRequest: IContactRequest, existingLead: ILead): Promise<ILead>;

  buildSFDCContact(
    contactRequest: IContactRequest,
    contactId: string,
    existingContact: IContact,
  ): Promise<IContact>;

  setFTParamsInLead(contactRequest: IContactRequest, lead: ILead): void;

  setLTParamsInLead(contactRequest: IContactRequest, lead: ILead): void;

  mqlOrReMqlFlow(
    contactRequest: IContactRequest,
    lead: ILead,
    existingLeadStatus: string | null,
  ): void;

  createNoteForLTFieldsUpdate(existingLead: ILead, newLead: ILead): string;
}
