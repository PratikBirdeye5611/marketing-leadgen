import { IDuplicateBusinessRequest, IBusinessESResponse } from '../../types/duplicate-business.types';

export interface IBusinessProfileService {
  findDuplicateBusinessOnFree(request: IDuplicateBusinessRequest): Promise<IBusinessESResponse | null>;
}