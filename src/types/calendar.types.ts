import { IAccount, ILead } from "./sfdc-lead.types";

export interface ICalendarEventRequest {
  organizerEmailIds?: string[];
  organizerDisplayName?: string;
  attendeeEmailIds?: string[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
  summary?: string;
  description?: string;
  location?: string;
}

export interface IGoogleCalendarAddEventResponse {
  eventId?: string;
  htmlLink?: string;
  organizerEmailId?: string;
  organizerSfdcId?: string;
  startTime?: string;
  endTime?: string;
  meetingId?: string;
  meetingJoinUrl?: string;
  meetingPassword?: string;
  attendees?: string[];
}

export interface ICalendarInviteContent {
  id: number;
  summary?: string;
  description?: string;
  location?: string;
  summary_template?: string;
  description_template?: string;
}

export interface ICalendarBooking {
  id?: number;
  status?: string;
  contact_request_id?: number;
  attendee_email_id?: string;
  additional_attendees?: string;
  organizer_email_id?: string;
  organizer_sfdc_id?: string;
  organizer_display_name?: string;
  page_id?: number;
  page_name?: string;
  page_slug?: string;
  event_id?: string;
  google_invite_link?: string;
  meeting_id?: string;
  meeting_join_url?: string;
  meeting_password?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  attendee_comments?: string;
  lead_campaign?: string;
  lead_sub_campaign?: string;
  lead_campaignkw?: string;
  lead_sfdc_campaign?: string;
  lead_content?: string;
  lead_medium?: string;
  lead_url?: string;
  visit_id?: string;
  session_id?: string;
  reschedule_meeting_url?: string;
  first_name?: string;
  last_name?: string;
  attendee_phone?: string;
  business_name?: string;
  business_phone?: string;
  user_message?: string;
  updated_start_time?: string;
  updated_end_time?: string;
}

export interface ICalendarBookingTemplateObject {
  productName?: string;
  attendeeFirstName?: string;
  attendeeLastName?: string;
  attendeeName?: string;
  attendeePhone?: string;
  attendeeComments?: string;
  businessName?: string;
  businessNumber?: string;
  businessPhone?: string;
  organizerName?: string;
  organizerEmail?: string;
  meetingTime?: string;
  meetingDate?: string;
  meetingTimeOnly?: string;
  meetingDescription?: string;
  duration?: string;
  leadCampaign?: string;
  leadSubCampaign?: string;
  leadCampaignKW?: string;
  leadSfdcCampaign?: string;
  rescheduleMeetingUrl?: string;
}

export  interface SfdcResponse<T> {
  records: T[];
  totalSize?: number;
  done?: boolean;
}

export interface IPageUrlCalendarBookingTemplateView {
  id?: number;
  type?: string;
  slug?: string;
  requestType?: string;
  meetingDescription?: string;
  active?: boolean;
  fallbackCalendar?: string;
}

export interface ICalendarSdrRules {
  id?: number;
  segment?: string;
  country?: string;
  salesRepresentatives?: string;
  pageUrl?: IPageUrl;
}

export interface IPageUrl {
  id?: number;
  type?: string;
  slug?: string;
  active?: boolean;
  request_type?: string;
  distribution_type?: string;
  fallback_calendar?: string;
  segment_assignment_enabled?: boolean;
  sales_rep?: ISalesRepresentative[];
  calendar_invite_content_id?: number;
}

export interface ISalesRepresentative {
  id?: number;
  emailId?: string;
  name?: string;
  sfdcId?: string;
  active?: boolean;
  pageUrlId?: number;
}

export interface IBookingSalesRep {
  salesRepresentativesId?: number;
  emailId?: string;
  name?: string;
  sfdcId?: string;
  pageUrlId?: number;
}

export interface ISfdcRoleAndLocationMapping {
  id?: number;
  sfdc_role?: string;
  location?: number;
  segment?: string;
}


export interface ICalendarNotificationDto {
  organizerName?: string;
  attendeeName?: string;
  meetingTimeDetails?: string;
  leadUrl?: string;
  businessName?: string;
  businessId?: string;
  salesforceLead?: string;
  opportunity?: string;
  accountId?: string;
}

export interface IUpsellOpportunity {
  Id?: string;
  Name?: string;
  StageName?: string;
  Lead_name__r?: ILead;
  Account?: IAccount;
}

export interface IAdditionalParameters {
  dataModelName?: string;
  data?: unknown[];
}

export interface IEmailRequest {
  emailIds: string[];
  addtionalParams?: IAdditionalParameters;
}