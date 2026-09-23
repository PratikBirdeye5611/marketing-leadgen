import { Request } from 'express';

export function extractUserIpAddress(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  return req.socket?.remoteAddress;
}

export function isValidIP(ipAddress: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
    return false;
  }
  if (ipv4Regex.test(ipAddress)) {
    const parts = ipAddress.split('.').map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }
  return true;
}
