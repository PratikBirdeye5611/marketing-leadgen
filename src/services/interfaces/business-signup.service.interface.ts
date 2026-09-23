import { IBusinessLiteDto } from '../../types/business-lite.types';

export interface IBusinessSignupService {
  getBusinessFromCore(businessNumber: string, envFlag: string, region: string | null): Promise<IBusinessLiteDto | null>;
  getBusinessFromCoreForEU(businessNumber: string): Promise<IBusinessLiteDto | null>;
}