import { IContactRequest } from '../../types/contact-request.types';
import { IZohoLeadMessage } from '../../types/zoho-lead.types';

export interface ILeadGenService {
  submitDemoRequest(
    contactRequest: IContactRequest,
    userIpAddress?: string,
    delayInClosestApiCall?: number,
  ): Promise<IZohoLeadMessage>;

  doLeadGenerationProcess(
    contactRequest: IContactRequest,
    delayInClosestApiCall?: number,
  ): Promise<void>;

  genericEmailDemoRequest(contactRequest: IContactRequest): Promise<void>;

  shouldSendInvite(contactRequest: IContactRequest): Promise<boolean>;

  doBusinessAggregationIfSourceIsGoogle(contactRequest: IContactRequest): Promise<void>;

  fetchLeadScoreById(requestId: number): Promise<number | null>;
}
