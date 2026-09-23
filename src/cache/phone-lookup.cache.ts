import { getRedisClient } from './redis.client';
import { env } from '../config/env';
import { IPhoneValidationDto } from '../types/phone.types';

const CACHE_KEY_PREFIX = 'NexusLookup:';

export class PhoneLookupCache {
  async get(phoneNumber: string): Promise<IPhoneValidationDto | null> {
    try {
      const value = await getRedisClient().get(`${CACHE_KEY_PREFIX}${phoneNumber}`);
      if (!value) return null;
      return JSON.parse(value) as IPhoneValidationDto;
    } catch {
      return null;
    }
  }

  async set(phoneNumber: string, data: IPhoneValidationDto): Promise<void> {
    try {
      await getRedisClient().setex(
        `${CACHE_KEY_PREFIX}${phoneNumber}`,
        env.redis.ttl.phoneLookup,
        JSON.stringify(data),
      );
    } catch { }
  }
}
