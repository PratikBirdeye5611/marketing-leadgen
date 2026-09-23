export enum RequestType {
  CONTACT = 'contact',
  DEMO = 'demo',
  SCAN = 'scan',
}

export enum FormFillType {
  MANUAL = 'MANUAL',
  COOKIE = 'COOKIE',
  URL = 'URL',
}

export enum LeadRank {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export enum LeadSource {
  WEB_LEAD = 'Web Lead',
  INBOUND_CALL = 'Inbound Call',
  LIVE_CHAT = 'Live Chat',
  LIST_UPLOAD = 'List Upload',
}

export function getLeadSourceOrDefault(leadSource: string | null | undefined): LeadSource {
  const match = Object.values(LeadSource).find((s) => s.toLowerCase() === (leadSource ?? '').toLowerCase());
  return match ?? LeadSource.WEB_LEAD;
}

export enum LeadRequestType {
  SCAN = 'scan',
  CALENDAR_LEAD = 'CALENDAR_LEAD',
}

export enum PartialLeadFormType {
  FREE_TRIAL_BY_EMAIL = 'free_trial_by_email',
}

export enum SFDCLeadStatus {
  NEW = 'New',
  WORKING = 'Working',
  OPEN = 'Open',
  DOWNGRADE = 'Downgrade',
  CONVERTED = 'Converted',
}

export enum ExistingLeadStatus {
  CREATED = 'Created',
  UPDATED = 'Updated',
  REMQL = 'ReMQL',
}


export enum BookingStatus {
  SUBMITTED = 'Submitted',
  PROCESSING = 'Processing',
  BOOKED = 'Booked',
  FAILED = 'Failed',
}

export enum LeadCreatedStatus {
  DEFAULT = 0,
  SUCCESSFULLY_CREATED = 1,
  SKIP_LEAD = 3,
  FORCEFULLY_CREATED = 5,
  SUPPORT_SKIP = 6,
  VALIDATION_FAILURE = 41,
  EXCEPTION = 42,
}

export enum LeadStage {
  SUSPECT = 'Suspect',
  PROSPECT = 'Prospect',
  MQL = 'MQL',
  SAL = 'SAL',
  SQL = 'SQL',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost',
  DEAD = 'Dead',
}

export function getValidLeadStage(stage: string | null | undefined): LeadStage | null {
  if ((stage ?? '').toLowerCase() === LeadStage.SUSPECT.toLowerCase()) return LeadStage.SUSPECT;
  if ((stage ?? '').toLowerCase() === LeadStage.PROSPECT.toLowerCase()) return LeadStage.PROSPECT;
  if ((stage ?? '').toLowerCase() === LeadStage.MQL.toLowerCase()) return LeadStage.MQL;
  return null;
}

export enum ScanType {
  FREE_SCAN = 'FREE_SCAN',
  PARTNER_SCAN = 'PARTNER_SCAN',
  LEN_PAGE_SCAN = 'LEN_PAGE_SCAN',
  SUCCESS_PORTAL_SCAN = 'SUCCESS_PORTAL_SCAN',
  LOCAL_SEO_AUDIT_SCAN = 'LOCAL_SEO_AUDIT_SCAN',
  BD_PARTNER_SCAN = 'BD_PARTNER_SCAN',
  LEAD_SCAN = 'LEAD_SCAN',
}

export enum DistributionType {
  BASED_ON_AVAILABILITY = 'Based on Availability',
  ROUND_ROBIN = 'Round Robin',
}

export enum CountryCode {
  US = 'US',
  UK = 'UK',
  GB = 'GB',
  AU = 'AU',
  NZ = 'NZ',
  CA = 'CA',
  IE = 'IE',
  NL = 'NL',
  LU = 'LU',
  BE = 'BE',
  SE = 'SE',
  NO = 'NO',
  DK = 'DK',
  FI = 'FI',
  IS = 'IS',
  SG = 'SG',
  MY = 'MY',
  MX = 'MX',
  PR = 'PR',
}

export enum EmailServiceConstants {
  REVIEW_MASTERCLASS_EMAIL_TYPE = 'review_masterclass',
  FREE = 'Free',
  SCAN_TOOL_CONFIRMATION = 'scan_tool_confirmation',
}

export enum Region {
  US = 'US',
  UK = 'UK',
}
