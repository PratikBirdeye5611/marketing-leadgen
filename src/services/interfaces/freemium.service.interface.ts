import { IUpdateBusinessRequest } from '../../types/business-update.types';

export interface IFreemiumService {
  updateBusiness(business: IUpdateBusinessRequest, businessId: string, envFlag: string): Promise<void>;
}