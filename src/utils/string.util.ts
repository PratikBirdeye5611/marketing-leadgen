export function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0;
}

export function isNotBlank(value: string | null | undefined): boolean {
  return !isBlank(value);
}

export function trimToNull(value: string | null | undefined): string | null {
  if (isBlank(value)) return null;
  return value!.trim();
}

export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeString(value: string | null | undefined): string {
  if (!value) return '';
  const normalized = value.normalize('NFD').replace(/[^\x00-\x7F]/g, '');
  return normalized.trim();
}

export function truncate(value: string | null | undefined, maxLength: number): string {
  if (!value) return '';
  return value.length > maxLength ? value.substring(0, maxLength) : value;
}

export function getTrimmedBaseURL(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('?')) return url.substring(0, url.indexOf('?'));
  if (url.includes('%3F')) return url.substring(0, url.indexOf('%3F'));
  if (url.includes('%3f')) return url.substring(0, url.indexOf('%3f'));
  return url;
}

export function buildLogSearchKey(contactRequestId: number, emailId?: string): string {
  if (!emailId) return `unknown-${contactRequestId}`;
  const parts = emailId.split('@');
  if (parts.length !== 2) return `invalidEmail-${contactRequestId}`;
  const localPart = parts[0];
  const domain = parts[1];
  const visibleLength = Math.min(5, localPart.length);
  const visible = localPart.substring(0, visibleLength);
  return `${visible}*****@${domain}-${contactRequestId}`;
}

export function validateAndUpdatePhoneNumberCode(phone: string): string {
  const numbersOnly = phone.replace(/[^0-9]/g, '');
  if (numbersOnly.length === 11 && numbersOnly.startsWith('0')) {
    return phone.substring(1);
  }
  return phone;
}

export function parseLocationValue(value: string | null | undefined): number {
  if (!value || value.trim().length === 0) return 1;
  const trimmed = value.trim();
  if (trimmed.includes('-')) return parseInt(trimmed.split('-')[0].trim(), 10);
  if (trimmed.endsWith('+')) return parseInt(trimmed.replace('+', '').trim(), 10);
  return parseInt(trimmed, 10);
}

export function decodeValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function joinWith(separator: string, ...parts: (string | null | undefined)[]): string {
  return parts.filter(isNotBlank).join(separator);
}

export function getPublicProfileURL(
  businessName: string,
  businessId: string,
  extra: string,
): string {
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${businessId}${extra}`;
}
