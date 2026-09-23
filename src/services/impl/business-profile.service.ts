import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { env } from '../../config/env';
import { APIEndpoints } from '../../config/constants';
import { IDuplicateBusinessRequest, ISearchBusinessResponse, IBusinessESResponse } from '../../types/duplicate-business.types';
import { IBusinessProfileService } from '../interfaces/business-profile.service.interface';

export class BusinessProfileService implements IBusinessProfileService {
  async findDuplicateBusinessOnFree(request: IDuplicateBusinessRequest): Promise<IBusinessESResponse | null> {
    const url = `${env.growth.baseUrl}${APIEndpoints.BUSINESS_ISPRESENT}`;
    try {
      const result = await createAPICall<ISearchBusinessResponse>(url, 'POST', constructHttpHeader(), request);
      if (result?.businesses && result.businesses.length > 0) {
        return result.businesses[0];
      }
      return null;
    } catch (e) {
      console.error('Exception while fetching duplicate business from free', request, url, e);
      return null;
    }
  }
}