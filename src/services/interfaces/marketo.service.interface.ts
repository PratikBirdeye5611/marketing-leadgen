import { IContactRequest } from '../../types/contact-request.types';
import {
  IMarketoUserDetailsResponse,
  IMarketoCreateOrUpdateUserResponse,
  IMarketoAddToListResponse,
} from '../../types/marketo.types';

export interface IMarketoService {
  submitDemoRequestToMarketo(
    contactRequest: IContactRequest,
    isPartialLead: boolean,
  ): Promise<void>;

  getMarketoUser(email: string, retryCount: number): Promise<IMarketoUserDetailsResponse | null>;

  addMarketoUser(email: string, retryCount: number): Promise<IMarketoCreateOrUpdateUserResponse | null>;

  addMarketoUserToList(
    marketoId: number,
    retryCount: number,
    listId: string,
  ): Promise<IMarketoAddToListResponse | null>;
}
