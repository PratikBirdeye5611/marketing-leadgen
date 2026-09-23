import { IResultDto } from '../../../types/phone.types';

export interface IMailgunService {
  validateEmail(emailId: string): Promise<IResultDto>;
}
