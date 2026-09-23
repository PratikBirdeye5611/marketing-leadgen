import { getRedisClient } from './redis.client';
import { env } from '../config/env';
import { isBlank, isNotBlank } from '../utils/string.util';

const CACHE_KEY_PREFIX = 'SfdcLead:';
const KEY_EXPIRY_HOURS = 24;
export class LeadCache {
  private static readonly KEY_EXPIRY_SECONDS = 86400; // 24 hours
  async removeLeadIdByEmail(emailId: string): Promise<void> {
    try {
      await getRedisClient().del(`${CACHE_KEY_PREFIX}${emailId}`);
    } catch { }
  }

  async canCreateLeadByIp(ipAddress: string, leadEmailId: string): Promise<boolean> {
    const key = `${CACHE_KEY_PREFIX}${ipAddress}`;
    try {
      const client = getRedisClient();
      const exists = await client.exists(key);
      if (!exists) return true;
      const isMember = await client.sismember(key, leadEmailId);
      if (isMember) return true;
      const count = await client.scard(key);
      return count < env.lead.dailyLimit;
    } catch {
      return true;
    }
  }

  async cacheLeadEmailByIp(ipAddress: string, leadEmailId: string): Promise<void> {
    if (isBlank(ipAddress) || isBlank(leadEmailId)) return;
    try {
      const key = `${CACHE_KEY_PREFIX}${ipAddress}`;
      const client = getRedisClient();
      await client.sadd(key, leadEmailId);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const ttl = Math.floor((endOfDay.getTime() - Date.now()) / 1000);
      await client.expire(key, ttl);
    } catch { }
  }

  async getLeadIdByEmail(emailId: string): Promise<string | null> {
    try {
      const client = getRedisClient();
      const leadId = await client.get(CACHE_KEY_PREFIX + emailId);
      console.log(`Retrieved mapped SFDC leadId ${leadId} with emailId ${emailId} from cache`);
      return leadId;
    } catch (e) {
      console.error(`Exception while getting key ${CACHE_KEY_PREFIX + emailId} from redis`, e);
      return null;
    }
  }

  async cacheLeadIdByEmail(emailId: string, leadId: string): Promise<void> {
    if (!isNotBlank(emailId) || !isNotBlank(leadId)) return;
    try {
      const client = getRedisClient();
      await client.set(CACHE_KEY_PREFIX + emailId, leadId, 'EX', KEY_EXPIRY_HOURS * 60 * 60);
      console.log(`EmailId is mapped with SFDC lead in redis cache for emailId: ${emailId}, Lead Id: ${leadId}`);
    } catch (e) {
      console.error(`Exception while caching key ${CACHE_KEY_PREFIX + emailId} in redis`, e);
    }
  }
}
