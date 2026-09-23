import { IContactRequest } from '../../types/contact-request.types';
import { ICalendarBooking, ICalendarNotificationDto, IGoogleCalendarAddEventResponse, IPageUrlCalendarBookingTemplateView } from '../../types/calendar.types';

export interface ICalendarBookingService {
  sendGoogleCalendarInvite(contactRequest: IContactRequest): Promise<void>;

  shouldSendInvite(contactRequest: IContactRequest): Promise<boolean>;

  setCalendarInviteCommentInRequest(contactRequest: IContactRequest): void;

  getCalendarEventDetailsById(
    emailId: string,
    calendarEventId: string,
  ): Promise<IGoogleCalendarAddEventResponse>;

  patchEvent(
    calendarEventRequest: unknown,
    calendarEventId: string,
    meetingId: string,
  ): Promise<IGoogleCalendarAddEventResponse>;

  getFormattedCalendarEventDate(
    eventDate: string,
    eventTime: string,
    timezone: string,
  ): string;

  sendNotificationToPageOwner(
    calendarNotificationDto: ICalendarNotificationDto,
    emailType: string,
    recipientsEmailIds: string[],
  ): Promise<void>;
}
