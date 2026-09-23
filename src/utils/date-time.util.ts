import { formatInTimeZone } from 'date-fns-tz';

export const DateFormats = {
  SFDC_LEAD_DATE_FORMAT: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  DATE_FORMAT_YYYYMMDDTHHMMZ: "yyyyMMdd'T'HHmmz",
  DATE_FORMAT_YYYYMMDDHHMM: 'yyyy-MM-dd HH:mm',
  DATE_FORMAT_YYYYMMDD: 'yyyy-MM-dd',
  DATE_FORMAT_MMMDDYYYYHHMMZ: 'MMM dd yyyy HH:mm z',
  VIEW_DATE_FORMAT: 'EEEE, MMMM d, yyyy h:mm a z',
  VIEW_WEEK_DATE_FORMAT: 'EEEE, MMMM d, yyyy',
  VIEW_HOUR_MIN_FORMAT: 'h:mm a',
  VIEW_DATE_FORMAT_2: "EEEE, MMMM dd, yyyy 'at' hh:mm a z",
} as const;

export function formatSFDCDate(date: Date): string {
  return date.toISOString();
}

export function atEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getTodayDate(startOfDay: boolean): Date {
  const today = new Date();
  if (startOfDay) {
    today.setHours(0, 0, 0, 0);
  }
  return today;
}

export function getZonedDateFromString(
  format: string,
  date: string,
  time: string,
  timezone: string,
): Date {
  const dateTimeStr = `${date} ${time}`;
  const parsed = new Date(dateTimeStr);
  return parsed;
}

export function formatZonedDateInSpecificFormat(date: Date, timezone : string, format: string): string {
 return formatInTimeZone(date, timezone, format);
}

export function zonedTimeFormatToDisplay(
  epochMillis: number,
  timeZoneId: string,
  formatter: string,
): string {
  return formatInTimeZone(epochMillis, timeZoneId, formatter);
}

export function parseSfdcLeadDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function daysDifference(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((dateB.getTime() - dateA.getTime()) / msPerDay);
}

export function isExpiredCalendarEvent(endTime: string): boolean {
  const end = new Date(endTime);
  return Date.now() > end.getTime();
}

export function getCalendarEventDate(eventDate: string, eventTime: string, timezone: string): Date {
  return getZonedDateFromString(DateFormats.DATE_FORMAT_YYYYMMDDHHMM, eventDate, eventTime, timezone);
}

export function getFormattedCalendarEventDateToDisplay(eventDate: string, eventTime: string, timezone: string): string {
  const scheduledTime = getCalendarEventDate(eventDate, eventTime, timezone);
  return zonedTimeFormatToDisplay(scheduledTime.getTime(), timezone, DateFormats.VIEW_DATE_FORMAT);
}

export function getFormattedCalendarEventDateToDisplayForCalendarNotification(
  eventDate: string,
  eventTime: string,
  timezone: string,
): string {
  const scheduledTime = getCalendarEventDate(eventDate, eventTime, timezone);
  return zonedTimeFormatToDisplay(scheduledTime.getTime(), timezone, DateFormats.VIEW_DATE_FORMAT_2);
}