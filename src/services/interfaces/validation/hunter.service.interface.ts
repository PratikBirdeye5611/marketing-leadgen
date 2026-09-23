import { IResultDto } from '../../../types/phone.types';

export interface IHunterService {
  validateEmail(emailId: string): Promise<IResultDto>;
}
