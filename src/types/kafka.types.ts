import { IContactRequest } from "./contact-request.types";

export interface IKafkaMessage<T> {
  kafkaTopic: string;
  messageObject: T;
  contactRequestId?: number;
  expiration?: number;
  retryCount?: number;
  customProperties?: Record<string, string>;
  contextMap?: Record<string, string>;
}

export interface CreateBusinessKafkaMessage {
  contactRequestId: number;
  contactRequestMessage: IContactRequest; // your existing interface
}

export interface IUpsellConvertLeadKafkaMessage<T> {
  contactRequest: T;
  leadId: string;
}

export interface ICalendarLeadTextKafkaMessage<T> {
  contactRequestId: number;
  calendarBooking: unknown;
  contactRequest: T;
  meetingJoinUrl?: string;
  salesRepName?: string;
}

export interface IScanReportUrlUpdateKafkaMessage {
  businessId: number;
  reportUrl: string;
  scanRequestId: string;
  dateAdded: number;
}

export interface INexusEmailInputMessage {
  genericData: IEmailGenericData;
  metaData: IEmailMetaData;
  dataObject?: Record<string, unknown>;
}

export interface IEmailGenericData {
  from?: string;
  fromName?: string;
  subject?: string;
  to: string[];
}

export interface IEmailMetaData {
  businessNumber?: number;
  businessId?: number;
  emailType?: string;
  emailSubType?: string;
  ampEmailSubType?: string;
  applyBranding?: boolean;
  externalUid?: string;
  recipientType?: string;
}
