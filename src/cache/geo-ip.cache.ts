import { getRedisClient } from './redis.client';
import { env } from '../config/env';
import { IGeoIPLocation } from '../types/geo-ip.types';

const HASH_KEY = 'GeoIpServiceKey';

export class GeoIPCache {
  async get(ipAddress: string): Promise<IGeoIPLocation | null> {
    try {
      const value = await getRedisClient().hget(HASH_KEY, ipAddress);
      if (!value) return null;
      return JSON.parse(value) as IGeoIPLocation;
    } catch {
      return null;
    }
  }

  async set(ipAddress: string, data: IGeoIPLocation): Promise<void> {
    try {
      await getRedisClient().hset(HASH_KEY, ipAddress, JSON.stringify(data));
      await getRedisClient().expire(HASH_KEY, env.redis.ttl.geoIp);
    } catch { }
  }
}
