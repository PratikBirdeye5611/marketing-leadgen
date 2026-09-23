import { IGeoIPLocation } from '../../types/geo-ip.types';

export interface IGeoIPService {
  getCountryFromIP(clientIpAddress: string): Promise<IGeoIPLocation | null>;

  getCountryFromIPWithException(clientIpAddress: string): Promise<IGeoIPLocation>;
}
