import { IGeoIPService } from '../interfaces/geo-ip.service.interface';
import { IGeoIPLocation } from '../../types/geo-ip.types';
import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { InputValidationException } from '../../exceptions/input-validation.exception';
import { ErrorCodes } from '../../config/constants';
import { env } from '../../config/env';

const GEO_IP_CACHE_KEY = 'GeoIpServiceKey';

export class GeoIPService implements IGeoIPService {
  private cache = new Map<string, IGeoIPLocation>();

  async getCountryFromIP(clientIpAddress: string): Promise<IGeoIPLocation | null> {
    if (!clientIpAddress) return null;

    const cached = this.cache.get(`${GEO_IP_CACHE_KEY}:${clientIpAddress}`);
    if (cached) return cached;

    const result = await this.fetchFromAPI(clientIpAddress);
    if (result) {
      this.cache.set(`${GEO_IP_CACHE_KEY}:${clientIpAddress}`, result);
    }
    return result;
  }

  async getCountryFromIPWithException(clientIpAddress: string): Promise<IGeoIPLocation> {
    const result = await this.getCountryFromIP(clientIpAddress);
    if (!result || !result.response) {
      throw new InputValidationException(
        ErrorCodes.INVAILD_RESPONSE_IN_GEO_IP_SERVICE,
        undefined,
        'No response from GeoIP service',
        'WARN',
      );
    }
    return result;
  }

  private async fetchFromAPI(clientIpAddress: string): Promise<IGeoIPLocation | null> {
    try {
      const url = `${env.geoIp.baseUrl}?ip=${clientIpAddress}&key=${env.geoIp.apiKey}&package=WS3&lang=en`;
      return await createAPICall<IGeoIPLocation>(url, 'GET', constructHttpHeader());
    } catch {
      return null;
    }
  }
}
