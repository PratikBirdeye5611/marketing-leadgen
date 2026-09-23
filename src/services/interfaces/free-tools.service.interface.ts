import { IContactRequest } from '../../types/contact-request.types';

export interface IFreeToolsService {
  generateScanReportUrlForLead(contactRequest: IContactRequest): Promise<string>;
}
