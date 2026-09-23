import { getRedisClient } from './redis.client';

const CACHE_KEY_PREFIX = 'ScanTool:';
const CACHE_KEY_SEPARATOR = '$';
const RESULTS_TIMEOUT_SECONDS = 24 * 60 * 60;

function getScanReportUrlKey(
  businessName: string,
  phone: string,
  zip: string,
  placeId: string | null | undefined,
  userEmail: string,
): string {
  const placeIdPart = placeId ?? 'null';
  return [
    CACHE_KEY_PREFIX + businessName,
    phone,
    zip,
    placeIdPart,
    userEmail,
  ].join(CACHE_KEY_SEPARATOR);
}

export async function cacheScanReportUrl(
  businessName: string,
  phone: string,
  zip: string,
  placeId: string | null | undefined,
  userEmail: string,
  result: string,
): Promise<void> {
  try {
    const key = getScanReportUrlKey(businessName, phone, zip, placeId, userEmail);
    const client = getRedisClient();
    await client.set(key, result, 'EX', RESULTS_TIMEOUT_SECONDS);
  } catch (e) {
    console.error('Error caching scan report url:', e);
  }
}

export async function getScanReportUrl(
  businessName: string,
  phone: string,
  zip: string,
  placeId: string | null | undefined,
  userEmail: string,
): Promise<string | null> {
  try {
    const key = getScanReportUrlKey(businessName, phone, zip, placeId, userEmail);
    const client = getRedisClient();
    return await client.get(key);
  } catch (e) {
    console.error('Error getting scan report url from cache:', e);
    return null;
  }
}