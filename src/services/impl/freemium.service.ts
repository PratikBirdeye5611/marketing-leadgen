import { createAPICall, constructHttpHeaderWithServiceName } from '../../utils/http.util';
import { env } from '../../config/env';
import { APIEndpoints } from '../../config/constants';
import { IUpdateBusinessRequest } from '../../types/business-update.types';
import { IFreemiumService } from '../interfaces/freemium.service.interface';

export class FreemiumService implements IFreemiumService {
  async updateBusiness(business: IUpdateBusinessRequest, businessId: string, envFlag: string): Promise<void> {
    const coreEndpoint = envFlag.toLowerCase() === '1' ? env.coreServices.baseUrl : env.coreBusiness.freeEndpoint;
    const url = `${coreEndpoint}${APIEndpoints.BUSINESS_UPDATE ?? '/v1/public/business/update'}`;
    try {
      const headers = {
        ...constructHttpHeaderWithServiceName(),
        'business-id': businessId,
        'business-type': 'paid',
      };
      await createAPICall(url, 'PUT', headers, business);
      console.log('Successfully updated business for business id:', businessId, url);
    } catch (e) {
      console.error('Exception occurred updating business for business id:', businessId, url, e);
    }
  }
}