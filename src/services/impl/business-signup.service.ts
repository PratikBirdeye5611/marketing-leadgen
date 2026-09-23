import { createAPICall, constructHttpHeaderWithServiceName } from '../../utils/http.util';
import { env } from '../../config/env';
import { IBusinessLiteDto } from '../../types/business-lite.types';
import { IBusinessSignupService } from '../interfaces/business-signup.service.interface';

function resolveCoreEndpoint(envFlag: string, region?: string | null): string {
  if (region && region.toUpperCase() === 'UK') {
    return envFlag === '1' ? env.coreBusiness.paidEndpointEu : env.coreBusiness.freeEndpoint;
  }
  return envFlag === '1' ? env.coreBusiness.paidEndpoint : env.coreBusiness.freeEndpoint;
}

export class BusinessSignupService implements IBusinessSignupService {
  async getBusinessFromCore(
    businessNumber: string,
    envFlag: string,
    region: string | null,
  ): Promise<IBusinessLiteDto | null> {
    if (!businessNumber) return null;
    const coreEndpoint = resolveCoreEndpoint(envFlag, region);
    const url = `${coreEndpoint}/v1/business/getBusinessLite?key=businessNumber&value=${encodeURIComponent(businessNumber)}`;
    try {
      return await createAPICall<IBusinessLiteDto>(url, 'GET', constructHttpHeaderWithServiceName());
    } catch (e) {
      console.error('Exception while calling core Api for businessLite info', url, e);
      return null;
    }
  }

  async getBusinessFromCoreForEU(businessNumber: string): Promise<IBusinessLiteDto | null> {
    if (!businessNumber) return null;
    const url = `${env.coreBusiness.paidEndpointEu}/v1/business/getBusinessLite?key=businessNumber&value=${encodeURIComponent(businessNumber)}`;
    try {
      return await createAPICall<IBusinessLiteDto>(url, 'GET', constructHttpHeaderWithServiceName());
    } catch (e) {
      console.error('Exception while calling core Api for businessLite info (EU)', url, e);
      return null;
    }
  }
}