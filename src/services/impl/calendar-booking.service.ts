import { ICalendarBookingService } from '../interfaces/calendar-booking.service.interface';
import { IContactRequest } from '../../types/contact-request.types';
import {
  ICalendarBooking,
  IGoogleCalendarAddEventResponse,
  ICalendarEventRequest,
  IPageUrlCalendarBookingTemplateView,
  IBookingSalesRep,
  ICalendarBookingTemplateObject,
  ICalendarInviteContent,
  IPageUrl,
  IEmailRequest,
  ICalendarNotificationDto,
  IUpsellOpportunity,
  SfdcResponse,
} from '../../types/calendar.types';
import { ISFDCLeadOperationHelper } from '../interfaces/sfdc-lead-operation.helper.interface';
import { ILead, ISFDCEvent } from '../../types/sfdc-lead.types';
import { createAPICall, constructHttpHeaderWithServiceName, constructHttpHeader } from '../../utils/http.util';
import { isNotBlank, isBlank, parseLocationValue, joinWith } from '../../utils/string.util';
import { DateFormats, getCalendarEventDate, getFormattedCalendarEventDateToDisplay, getFormattedCalendarEventDateToDisplayForCalendarNotification, zonedTimeFormatToDisplay } from '../../utils/date-time.util';
import { getISOCode } from '../../utils/country.util';
import { LeadGenConstants, APIEndpoints, SFDCQueryParamConstants, EmailServiceConstants, ErrorCodes } from '../../config/constants';
import { BookingStatus, SFDCLeadStatus } from '../../types/enums';
import { env } from '../../config/env';
import { Knex } from 'knex';
import { renderCalendarBookingTemplate } from '../../utils/template-renderer.util';
import { SfdcConstants } from '../../config/constants';
import { IEmailService } from '../interfaces/email.service.interface';
import { LeadCache } from '../../cache/lead.cache';
import { LeadGenException } from '../../exceptions/leadgen.exception';

export class CalendarBookingService implements ICalendarBookingService {
  constructor(
    private readonly growthDb: Knex,
    private readonly bazaarifyDb: Knex,
    private readonly sfdcHelper: ISFDCLeadOperationHelper,
    private readonly emailService: IEmailService,
    private readonly leadCache: LeadCache,
  ) {}

  async sendGoogleCalendarInvite(contactRequest: IContactRequest): Promise<void> {
    if (
      isBlank(contactRequest.eventDate) ||
      isBlank(contactRequest.startTime) ||
      isBlank(contactRequest.endTime)
    ) return;

    let comment = isNotBlank(contactRequest.comments) ? `${contactRequest.comments}\n` : '';
    let isLeadOwner = false;
    let isSalesRep = false;
    let bookingRequest: ICalendarBooking | null = null;
    let organisersEmailIds: string[] | null = null;

    bookingRequest = await this.upsertCalendarBooking(null, contactRequest, null, null, BookingStatus.SUBMITTED);

    let ownerEmailId: string | null = null;
    let lead: ILead | null = null;
    let ownerId: string | null = null;

    try {
      lead = await this.fetchValidLeadByEmailId(contactRequest.emailId!, false);

      if (lead) {
        if (lead.Status === SFDCLeadStatus.CONVERTED) {
          ownerId = await this.getContactOwnerIdByContactId(lead.ConvertedContactId!);
          ownerEmailId = await this.getActiveSalesRepEmailBySFDCId(ownerId!);
        } else if (
          !lead.Status?.toLowerCase().includes(SFDCLeadStatus.DOWNGRADE.toLowerCase()) &&
          isNotBlank(lead.OwnerId)
        ) {
          ownerId = lead.OwnerId!;
          ownerEmailId = await this.getActiveSalesRepEmailBySFDCId(ownerId);
        }
      }
    } catch (e) {
      console.error('Error while searching Lead for Email:', contactRequest.emailId, e);
    }

    // Fallback calendar check
    let pageUrl: IPageUrlCalendarBookingTemplateView | null = null;
    let isFallbackCalendar = false;

    if (isNotBlank(contactRequest.slug)) {
      pageUrl = await this.findCalendarBookingTemplateBySlug(contactRequest.slug!);
      isFallbackCalendar = await this.shouldUseFallBackCalendar(contactRequest.slug!, '', pageUrl?.active ?? false);
    } else if (isNotBlank(contactRequest.pageURL)) {
      pageUrl = await this.findCalendarBookingTemplateByType(contactRequest.pageURL!);
      isFallbackCalendar = await this.shouldUseFallBackCalendar('', contactRequest.pageURL!, pageUrl?.active ?? false);
    }

    if (pageUrl && isBlank(ownerEmailId)) {
      if (
        pageUrl.fallbackCalendar &&
        !pageUrl.fallbackCalendar.toLowerCase().includes(LeadGenConstants.FALLBACK_CALENDAR_DEFAULT_VALUE) &&
        isFallbackCalendar
      ) {
        contactRequest.slug = pageUrl.fallbackCalendar;
        const pageUrlDb = await this.growthDb('page_url').where({ slug: contactRequest.slug }).first();
        if (pageUrlDb) {
          contactRequest.pageURL = pageUrlDb.type;
          if (bookingRequest) {
            bookingRequest.page_id = pageUrlDb.id;
            bookingRequest.page_slug = contactRequest.slug;
            bookingRequest.page_name = contactRequest.pageURL;
          }
        }
      }
    }

    // Segment assignment check
    let segmentAssignmentEnabled = false;
    if (isNotBlank(contactRequest.slug)) {
      const row = await this.growthDb('page_url').where({ slug: contactRequest.slug }).select('segment_assignment_enabled').first();
      segmentAssignmentEnabled = !!row?.segment_assignment_enabled;
    } else if (isNotBlank(contactRequest.pageURL)) {
      const row = await this.growthDb('page_url').where({ type: contactRequest.pageURL }).select('segment_assignment_enabled').first();
      segmentAssignmentEnabled = !!row?.segment_assignment_enabled;
    }

    if (lead && isBlank(ownerEmailId)) {
      const countryCode = getISOCode(lead.Country ?? '');
      let calendarSdrRules = null;

      if (await this.isChannelLead(contactRequest.industry, contactRequest.fromGoogle) && countryCode.toUpperCase() === 'GB') {
        calendarSdrRules = await this.getRuleForSegmentAndCountry(LeadGenConstants.CHANNEL, countryCode);
      } else {
        calendarSdrRules = await this.getRuleByCountry(countryCode);
      }

      if (calendarSdrRules) {
        const pageUrls = calendarSdrRules.pageUrl;
        if (pageUrls?.SalesRep?.length) {
          const salesRepEmails = pageUrls.SalesRep.map((sr: any) => sr.emailId);
          organisersEmailIds = salesRepEmails;
          contactRequest.salesRepEmailIds = organisersEmailIds ?? undefined;
          contactRequest.slug = pageUrls.slug;
          contactRequest.pageURL = pageUrls.type;
          if (bookingRequest) {
            bookingRequest.page_id = pageUrls.id;
            bookingRequest.page_slug = contactRequest.slug;
            bookingRequest.page_name = contactRequest.pageURL;
          }
        }
      }
    }

    if (isNotBlank(ownerEmailId)) {
      contactRequest.salesRepEmailIds = [ownerEmailId!];
      isLeadOwner = true;
    } else if (
      (!organisersEmailIds || !organisersEmailIds.length) &&
      segmentAssignmentEnabled &&
      await this.isChannelLead(contactRequest.industry, contactRequest.fromGoogle)
    ) {
      const calendarSdrRules = await this.getRuleForChannel(LeadGenConstants.CHANNEL);
      if (calendarSdrRules?.pageUrl) {
        contactRequest.slug = calendarSdrRules.pageUrl.slug;
        contactRequest.pageURL = calendarSdrRules.pageUrl.type;
        if (bookingRequest) {
          bookingRequest.page_id = calendarSdrRules.pageUrl.id;
          bookingRequest.page_slug = contactRequest.slug;
          bookingRequest.page_name = contactRequest.pageURL;
        }
      }

      organisersEmailIds = await this.filterSalesRepBySegment(
        contactRequest.pageURL,
        contactRequest.slug,
        LeadGenConstants.CHANNEL,
        contactRequest.salesRepEmailIds ?? [],
      );

      if (!organisersEmailIds?.length) {
        comment = `\n${this.capitalize(contactRequest.name ?? '')}${LeadGenConstants.FAILED_CALENDAR_MESSAGE1}${this.getFormattedCalendarEventDateToDisplayForFailedCases(contactRequest.eventDate!, contactRequest.startTime!, contactRequest.timezone!)}${LeadGenConstants.FAILED_CALENDAR_MESSAGE2}`;
        contactRequest.comments = comment;
        await this.upsertCalendarBooking(bookingRequest, contactRequest, null, null, BookingStatus.FAILED);
        return;
      } else {
        contactRequest.salesRepEmailIds = organisersEmailIds;
      }
    } else if (
      (!organisersEmailIds || !organisersEmailIds.length) &&
      segmentAssignmentEnabled &&
      isNotBlank(contactRequest.businessLocations)
    ) {
      if (lead) {
        const calendarSdrRules = await this.findSdrCondition(lead, contactRequest.businessLocations!, lead.Industry!);
        if (calendarSdrRules) {
          if (calendarSdrRules.salesRepresentatives) {
            organisersEmailIds = [calendarSdrRules.salesRepresentatives];
            contactRequest.salesRepEmailIds = organisersEmailIds;
            isSalesRep = true;
          }
          if (calendarSdrRules.pageUrl) {
            contactRequest.slug = calendarSdrRules.pageUrl.slug;
            contactRequest.pageURL = calendarSdrRules.pageUrl.type;
            if (bookingRequest) {
              bookingRequest.page_id = calendarSdrRules.pageUrl.id;
              bookingRequest.page_slug = contactRequest.slug;
              bookingRequest.page_name = contactRequest.pageURL;
            }
          }
        }
      }

      if (!organisersEmailIds?.length) {
        organisersEmailIds = await this.filterSalesRepEmailsByBusinessLocations(
          contactRequest.businessLocations!,
          contactRequest.pageURL,
          contactRequest.slug,
          contactRequest.salesRepEmailIds ?? [],
        );

        if (!organisersEmailIds?.length) {
          comment = `\n${this.capitalize(contactRequest.name ?? '')}${LeadGenConstants.FAILED_CALENDAR_MESSAGE1}${this.getFormattedCalendarEventDateToDisplayForFailedCases(contactRequest.eventDate!, contactRequest.startTime!, contactRequest.timezone!)}${LeadGenConstants.FAILED_CALENDAR_MESSAGE2}`;
          contactRequest.comments = comment;
          await this.upsertCalendarBooking(bookingRequest, contactRequest, null, null, BookingStatus.FAILED);
          return;
        } else {
          contactRequest.salesRepEmailIds = organisersEmailIds;
        }
      }
    }

    const googleCalendarResponse = await this.scheduleMeetingWithLeadOwner(
      contactRequest,
      isLeadOwner,
      bookingRequest,
      isSalesRep,
    );

    if (googleCalendarResponse) {
      contactRequest.calendarEventHtmlLink = googleCalendarResponse.htmlLink;
      contactRequest.meetingId = googleCalendarResponse.meetingId;
      contactRequest.organiserEmailId = googleCalendarResponse.organizerEmailId ? googleCalendarResponse.organizerEmailId : contactRequest.salesRepEmailIds?.[0];
      contactRequest.calendarEventId = googleCalendarResponse.eventId;


      const salesRepName = await this.getSalesRepNameByEmailId(googleCalendarResponse.organizerEmailId!);
      let inviteComment = '';
      if (isNotBlank(contactRequest.calendarEventHtmlLink)) {
        inviteComment += `\nCalendar Invite: ${contactRequest.calendarEventHtmlLink}`;
      }
      if (isNotBlank(salesRepName)) {
        inviteComment += `\nSales Rep: ${salesRepName}`;
      }
      comment += inviteComment;

      try {
        const event: ISFDCEvent = {
          Subject: `Meeting Booked via Birdeye Calendar with ${salesRepName}`,
          Location: googleCalendarResponse.htmlLink,
          Description: inviteComment,
          OwnerId: googleCalendarResponse.organizerSfdcId,
          StartDateTime: googleCalendarResponse.startTime,
          EndDateTime: googleCalendarResponse.endTime,
          WhoId: lead
            ? (lead.Status === SFDCLeadStatus.CONVERTED ? lead.ConvertedContactId : lead.Id)
            : undefined,
        };
        await this.sfdcHelper?.callToCreateSfdcResource(event, SfdcConstants.Event);
      } catch (e) {
        console.error('Error creating SFDC event:', e);
      }
      
      await this.sendCalendarNotification(contactRequest, lead, salesRepName, googleCalendarResponse.organizerEmailId ?? '');

    } else {
      comment = `\n${this.capitalize(contactRequest.name ?? '')}${LeadGenConstants.FAILED_CALENDAR_MESSAGE1}${this.getFormattedCalendarEventDateToDisplayForFailedCases(contactRequest.eventDate!, contactRequest.startTime!, contactRequest.timezone!)}${LeadGenConstants.FAILED_CALENDAR_MESSAGE2}`;
    }

    contactRequest.comments = comment;
  }

  async sendCalendarNotification(
    requestMessage: IContactRequest,
    lead: ILead | null,
    salesRepName: string | null,
    organizerEmailId: string,
  ): Promise<void> {
    console.log('[Calendar Notification] Going to send calendar notification to sales rep');

    const calendarNotificationDto: ICalendarNotificationDto = {
      attendeeName: salesRepName ?? undefined,
      organizerName: requestMessage.name,
      meetingTimeDetails: getFormattedCalendarEventDateToDisplayForCalendarNotification(
        requestMessage.eventDate!, requestMessage.startTime!, requestMessage.timezone!,
      ),
      businessName: requestMessage.businessName,
      businessId: requestMessage.businessNumber,
    };

    try {
      const existingLead = await this.sfdcHelper.callToSearchLeadByEmail(
        requestMessage.emailId!,
        SFDCQueryParamConstants.RETURN_FIELD_VALUE_BY_OWNER_ID_AND_STATUS_AND_DEVICE_NAME,
      );

      if (existingLead) {
        console.log(`Lead data found in SF : ${JSON.stringify(existingLead)}`);
        calendarNotificationDto.salesforceLead = `${env.sfdc.url}/lightning/r/Lead/${existingLead.Id}/view`;
      }

      const queryResponse = await this.sfdcHelper.executeSoqlQuery<IUpsellOpportunity>(
        SFDCQueryParamConstants.SOQL_QUERY_TO_FIND_OPPORTUNITY.replace('{0}', String(requestMessage.emailId)),
      );

      if (queryResponse) {
        const queryResult: SfdcResponse<IUpsellOpportunity> = queryResponse;

        if (queryResult?.records?.length) {
          console.log(`got OpportunityAndLeadStatus for businessNumber : ${requestMessage.businessNumber}, response : ${JSON.stringify(queryResult.records)}`);
          for (const upsellOpportunity of queryResult.records) {
            if (upsellOpportunity?.Id) {
              console.log(`Opportunity found in SF : ${upsellOpportunity.Id}`);
              calendarNotificationDto.opportunity = `${env.sfdc.url}/lightning/r/Opportunity/${upsellOpportunity.Id}/view`;
              if (upsellOpportunity.Account) {
                console.log(`Account in SF : ${upsellOpportunity.Account.Id}`);
                calendarNotificationDto.accountId = `${env.sfdc.url}/lightning/r/Account/${upsellOpportunity.Account.Id}/view`;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Exception while setting Lead/opp/account for request : ${JSON.stringify(requestMessage)}`, e);
    }

    if (lead?.Id) {
      calendarNotificationDto.leadUrl = `${env.sfdc.loginUrl}${lead.Id}`;
      console.log(`[Calendar Notification] lead was found ${calendarNotificationDto.leadUrl}`);
    }

    await this.sendNotificationToPageOwner(calendarNotificationDto, LeadGenConstants.CALENDAR_NOTIFICATION_SETUP_EMAIL_TYPE, [organizerEmailId],);
  }

  async sendNotificationToPageOwner(
    calendarNotificationDto: ICalendarNotificationDto,
    emailType: string,
    recipientsEmailIds: string[],
  ): Promise<void> {
    const emailRequest: IEmailRequest = {
      emailIds: recipientsEmailIds,
      addtionalParams: {
        dataModelName: LeadGenConstants.CALENDAR_NOTIFICATION_DATA_MODEL_NAME,
        data: [calendarNotificationDto],
      },
    };
    await this.emailService?.sendInstantEmailRequestToEmailMicroservice(emailType, emailRequest, EmailServiceConstants.FREE);
  }

  async shouldSendInvite(contactRequest: IContactRequest): Promise<boolean> {
    if (!contactRequest) return false;

    const pageUrl = await this.getPageUrl(contactRequest);
    if (!pageUrl) return false;
    if (pageUrl.requestType !== LeadGenConstants.CALENDAR_LEAD_REQUEST_TYPE) return true;

    const isUK = contactRequest.countryCode?.toUpperCase() === 'UK' || contactRequest.countryCode?.toUpperCase() === 'GB';
    const isAdvertisingAgency = contactRequest.industry?.toLowerCase() === LeadGenConstants.ADVERTISING_MEDIA_AGENCY_BE_CATEGORY.toLowerCase();
    const locations = parseLocationValue(contactRequest.businessLocations);

    const isAU = "AU" == contactRequest.countryCode?.toUpperCase();

    if(isAdvertisingAgency) return true;

    if (isUK && locations < 10)
    {
        return false;
    }
    if (isAU && locations < 4) {
        return false;
    }

    return true;
  }

  setCalendarInviteCommentInRequest(contactRequest: IContactRequest): void {
    const comment = this.createCalendarInviteCommonComment(contactRequest);
    if (isNotBlank(comment)) {
      contactRequest.comments = isNotBlank(contactRequest.comments)
        ? `${contactRequest.comments}\n${comment}`
        : comment;
    }
  }

  async getCalendarEventDetailsById(
    emailId: string,
    calendarEventId: string,
  ): Promise<IGoogleCalendarAddEventResponse> {
    const url = `${env.bizApp.url}${APIEndpoints.API_CALENDAR_EVENTS_GET}${emailId}/${calendarEventId}`;
    return createAPICall<IGoogleCalendarAddEventResponse>(
      url, 'GET', constructHttpHeaderWithServiceName(),
    );
  }

  async patchEvent(
    calendarEventRequest: unknown,
    calendarEventId: string,
    meetingId: string,
  ): Promise<IGoogleCalendarAddEventResponse> {
    const url = `${env.bizApp.url}${APIEndpoints.API_CALENDAR_EVENTS_PATCH}${calendarEventId}?meetingId=${meetingId}`;
    return createAPICall<IGoogleCalendarAddEventResponse>(
      url, 'PATCH', constructHttpHeaderWithServiceName(), calendarEventRequest,
    );
  }

  getFormattedCalendarEventDate(eventDate: string, eventTime: string, _timezone: string): string {
    return new Date(`${eventDate} ${eventTime}`).toISOString();
  }

  getFormattedCalendarEventDateToDisplayForFailedCases(
    eventDate: string,
    eventTime: string,
    timezone: string,
  ): string {
    const date = new Date(`${eventDate} ${eventTime}`);

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

    const time = `${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
    const zoneAbbr = get('timeZoneName');
    const monthDayYear = `${get('month')} ${get('day')}, ${get('year')}`;

    return `${time} ${zoneAbbr} on ${monthDayYear}`;
  }

  /**
   * Resolves the calendar date the meeting ends on. Falls back to the start
   * date when the request does not specify a separate end date (single-day
   * meetings), but allows multi-day bookings to specify eventEndDate.
   */
  private getEventEndDate(contactRequest: IContactRequest): string {
    return contactRequest.eventEndDate ?? contactRequest.eventDate!;
  }

  private async scheduleMeetingWithLeadOwner(
    contactRequest: IContactRequest,
    isLeadOwner: boolean,
    bookingRequest: ICalendarBooking | null,
    isSalesRep: boolean,
  ): Promise<IGoogleCalendarAddEventResponse | null> {
    const calendarEventRequest: ICalendarEventRequest = {
      organizerEmailIds: contactRequest.salesRepEmailIds,
      attendeeEmailIds: [contactRequest.emailId!],
      startTime: this.getFormattedCalendarEventDate(
        contactRequest.eventDate!,
        contactRequest.startTime!,
        contactRequest.timezone!,
      ),
      endTime: this.getFormattedCalendarEventDate(
        this.getEventEndDate(contactRequest),
        contactRequest.endTime!,
        contactRequest.timezone!,
      ),
      timezone: contactRequest.timezone,
    };

    bookingRequest = await this.upsertCalendarBooking(bookingRequest, contactRequest, calendarEventRequest, null, BookingStatus.PROCESSING);

    const pageUrl = contactRequest.pageURL;
    const slug = contactRequest.slug;

    try {
      const salesRepEmailIds = await this.fetchAvailableSalesRepEmails(
        contactRequest.salesRepEmailIds ?? [],
        calendarEventRequest,
        pageUrl,
        slug,
      );

      if (!salesRepEmailIds?.length) {
        await this.upsertCalendarBooking(bookingRequest, contactRequest, calendarEventRequest, null, BookingStatus.FAILED);
        return null;
      }

      let bookingSalesRep: IBookingSalesRep | null = null;

      if (isLeadOwner || isSalesRep) {
        bookingSalesRep = await this.getSalesRepForCalendarBooking(salesRepEmailIds[0]);
      } else if (isNotBlank(slug)) {
        const distributionType = await this.findDistributionTypeBySlug(slug!);
        if (distributionType?.toLowerCase() === 'Based_on_Availability'.toLowerCase()) {
          calendarEventRequest.organizerEmailIds = [salesRepEmailIds[0]];
        }
        bookingSalesRep = await this.getHighPrioritySalesRepBySlug(slug!, salesRepEmailIds);
      } else {
        const distributionType = await this.findDistributionTypeByType(pageUrl!);
        if (distributionType?.toLowerCase() === 'Based_on_Availability') {
          calendarEventRequest.organizerEmailIds = [salesRepEmailIds[0]];
        }
        bookingSalesRep = await this.getHighPrioritySalesRepByType(pageUrl!, salesRepEmailIds);
      }

      if (!bookingSalesRep) {
        await this.upsertCalendarBooking(bookingRequest, contactRequest, calendarEventRequest, null, BookingStatus.FAILED);
        return null;
      }

      const salesRepEmailId = bookingSalesRep.emailId!;
      calendarEventRequest.organizerEmailIds = [salesRepEmailId];
      calendarEventRequest.organizerDisplayName = bookingSalesRep.name;

      const primaryAttendees = [contactRequest.emailId!];
      const additionalAttendees = contactRequest.additionalAttendees ?? [];
      calendarEventRequest.attendeeEmailIds = [...primaryAttendees, ...additionalAttendees];

      contactRequest.leadOwner = bookingSalesRep.sfdcId;
      contactRequest.leadAutoAssignment = true;

      bookingRequest = await this.upsertCalendarBooking(bookingRequest, contactRequest, calendarEventRequest, null, BookingStatus.PROCESSING);

      const templateObject = await this.getCalendarBookingTemplateObject(
        contactRequest,
        salesRepEmailId,
        bookingSalesRep.name!,
        null,
        bookingRequest?.reschedule_meeting_url!,
      );

      await this.prepareCalendarInviteRequest(contactRequest, templateObject, calendarEventRequest);

      const googleCalendarResponse = await this.scheduleCalendarInviteEvent(calendarEventRequest);

      if (!isLeadOwner && bookingSalesRep.salesRepresentativesId && bookingSalesRep.pageUrlId) {
        await this.updateSalesRepLastBookingTime(bookingSalesRep.salesRepresentativesId, bookingSalesRep.pageUrlId);
      }

      googleCalendarResponse.organizerSfdcId = bookingSalesRep.sfdcId;
      bookingRequest = await this.upsertCalendarBooking(bookingRequest, contactRequest, calendarEventRequest, googleCalendarResponse, BookingStatus.BOOKED);

      return googleCalendarResponse;
    } catch (e) {
      console.error('Error while scheduling meeting:', e);
      await this.upsertCalendarBooking(bookingRequest, contactRequest, calendarEventRequest, null, BookingStatus.FAILED);
      return null;
    }
  }


  private async getCalendarBookingTemplateObject(requestMessage: IContactRequest, salesRepEmailId: string, salesRepName: string, productName: string | null, bookingRescheduleUrl: string): Promise<ICalendarBookingTemplateObject> {
    let pageUrl: IPageUrlCalendarBookingTemplateView | null = null;

    if (requestMessage.slug) {
      pageUrl = (await this.growthDb('page_url').where({ slug: requestMessage.slug }).select('id', 'type', 'slug', 'request_type as requestType', 'meeting_description as meetingDescription', 'active', 'fallback_calendar as fallbackCalendar', 'segment_assignment_enabled as segmentAssignmentEnabled').first()) ?? null;
    } else {
      pageUrl = (await this.growthDb('page_url').where({ type: requestMessage.pageURL }).select('id', 'type', 'slug', 'request_type as requestType', 'meeting_description as meetingDescription', 'active', 'fallback_calendar as fallbackCalendar', 'segment_assignment_enabled as segmentAssignmentEnabled').first()) ?? null;
    }

    const meetingDescription = pageUrl?.meetingDescription || requestMessage.pageURL;
    const useUserMessage = !!pageUrl && LeadGenConstants.CALENDAR_LEAD_REQUEST_TYPE.toLowerCase() === pageUrl.requestType?.toLowerCase();

    const scheduledTime = getCalendarEventDate(requestMessage.eventDate!, requestMessage.startTime!, requestMessage.timezone!);

    const templateObject: ICalendarBookingTemplateObject = {
      productName : productName ?? '',
      attendeeFirstName: requestMessage.firstName,
      attendeeLastName: requestMessage.lastName,
      attendeeName: requestMessage.name,
      attendeePhone: requestMessage.phone,
      attendeeComments: useUserMessage ? requestMessage.userMessage : requestMessage.comments,
      businessName: requestMessage.businessName,
      businessNumber: requestMessage.businessNumber,
      businessPhone: requestMessage.businessPhone,
      organizerName: salesRepName,
      organizerEmail: salesRepEmailId,
      meetingTime: getFormattedCalendarEventDateToDisplay(requestMessage.eventDate!, requestMessage.startTime!, requestMessage.timezone!),
      meetingDescription,
      meetingDate: zonedTimeFormatToDisplay(scheduledTime.getTime(), requestMessage.timezone!, DateFormats.VIEW_WEEK_DATE_FORMAT),
      meetingTimeOnly: zonedTimeFormatToDisplay(scheduledTime.getTime(), requestMessage.timezone!, DateFormats.VIEW_HOUR_MIN_FORMAT),
      duration: requestMessage.duration,
      leadCampaign: requestMessage.leadCampaign,
      leadSubCampaign: requestMessage.leadSubCampaign,
      leadCampaignKW: requestMessage.leadCampaignKW,
      leadSfdcCampaign: requestMessage.leadSfdcCampaign,
      rescheduleMeetingUrl: bookingRescheduleUrl,
    };

    return templateObject;
  }

  private async prepareCalendarInviteRequest(requestMessage: IContactRequest, templateObject: ICalendarBookingTemplateObject, calendarEventRequest: ICalendarEventRequest): Promise<void> {
    let pageUrl: IPageUrl | null = null;

    if (requestMessage.slug) {
      pageUrl = await this.growthDb('page_url').where({ slug: requestMessage.slug }).first();
    } else if (requestMessage.pageURL) {
      pageUrl = await this.growthDb('page_url').where({ page_url: requestMessage.pageURL }).first();
    }

    const calendarInviteContent: ICalendarInviteContent | null = pageUrl?.calendar_invite_content_id ? await this.findCalendarInviteContentById(pageUrl.calendar_invite_content_id) : null;

    calendarEventRequest.description = this.getCalendarInviteDescription(calendarInviteContent, requestMessage, templateObject);
    calendarEventRequest.summary = this.getCalendarInviteSummary(calendarInviteContent, requestMessage, templateObject);
    calendarEventRequest.location = this.getCalendarInviteLocation(calendarInviteContent, requestMessage, templateObject);
  }

  private async findCalendarInviteContentById(id: number): Promise<ICalendarInviteContent | null> {
    const row = await this.growthDb('calendar_invite_content').where({ id }).first();
    return row ?? null;
  }

  private getCalendarInviteDescription(calendarInviteContent: ICalendarInviteContent | null, requestMessage: IContactRequest, templateObject: ICalendarBookingTemplateObject): string {
    let eventDescription = calendarInviteContent?.description || LeadGenConstants.DEFAULT_EVENT_DESCRIPTION;

    try {
      eventDescription = renderCalendarBookingTemplate(eventDescription, templateObject);
    } catch (error) {
      console.error(`Error while parsing calendar invite description, pageUrl:${requestMessage.pageURL}, slug:${requestMessage.slug}, exception:`, error);
    }

    return eventDescription;
  }

  private getCalendarInviteSummary(calendarInviteContent: ICalendarInviteContent | null, requestMessage: IContactRequest, templateObject: ICalendarBookingTemplateObject): string {
    let summary = calendarInviteContent?.summary || LeadGenConstants.DEFAULT_EVENT_SUMMARY;

    try {
      summary = renderCalendarBookingTemplate(summary, templateObject);
    } catch (error) {
      console.error(`Error while parsing calendar invite summary, pageUrl:${requestMessage.pageURL}, slug:${requestMessage.slug}, exception:`, error);
    }

    return summary;
  }

  private getCalendarInviteLocation(calendarInviteContent: ICalendarInviteContent | null, requestMessage: IContactRequest, templateObject: ICalendarBookingTemplateObject): string {
    let location = calendarInviteContent?.location?.trim() ? calendarInviteContent.location : '';

    try {
      location = renderCalendarBookingTemplate(location, templateObject);
    } catch (error) {
      console.error(`Error while parsing calendar invite location, pageUrl:${requestMessage.pageURL}, slug:${requestMessage.slug}, exception:`, error);
    }

    return location;
  }

    private async scheduleCalendarInviteEvent(
      calendarEventRequest: ICalendarEventRequest,
    ): Promise<IGoogleCalendarAddEventResponse> {
      const url = `${env.bizApp.url}${APIEndpoints.API_CALENDAR_EVENTS_ADD}`;
      return createAPICall<IGoogleCalendarAddEventResponse>(
        url,
        'POST',
        constructHttpHeaderWithServiceName(),
        calendarEventRequest,
      );
  }

  

  private async fetchAvailableSalesRepEmails(
    salesRepEmailIds: string[],
    calendarEventRequest: ICalendarEventRequest,
    pageUrl?: string,
    slug?: string,
  ): Promise<string[] | null> {
    try {
      const salesRep = salesRepEmailIds?.length ? salesRepEmailIds : await this.getAllSalesRepEmailIds(pageUrl!, slug!);
      calendarEventRequest.organizerEmailIds = salesRep;
      const url = `${env.bizApp.url}${APIEndpoints.API_FETCH_AVAILABLE_SALES_REP_EMAILS}`;
      return await createAPICall<string[]>(url, 'POST', constructHttpHeaderWithServiceName(), calendarEventRequest);
    } catch {
      return null;
    }
  }

  private async fetchValidLeadByEmailId(leadEmailId: string, shouldWait: boolean): Promise<ILead> {
    let lead = await this.getLeadByEmail(leadEmailId);

    let retries = 1;
    if (shouldWait && lead == null) {
      do {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          lead = await this.getLeadByEmail(leadEmailId);
          ++retries;
        } catch (e) {
          console.error(`Error while waiting for fetching Lead owner for lead ${leadEmailId}, retries ${retries}`, e);
        }
      } while (retries < 10 && lead == null);
    }

    if (lead == null) {
      throw new LeadGenException(ErrorCodes.LEAD_NOT_FOUND_FOR_LEAD_OWNER);
    }

    console.log(
      `Fetch valid lead owner : emailId ${leadEmailId}, leadId ${lead.Id}, leadStatus ${lead.Status}, leadOwnerId ${lead.OwnerId}, retries ${retries}`,
    );

    return lead;
  }

  private async getLeadByEmail(leadEmailId: string): Promise<ILead | null> {
      const leadId = await this.leadCache.getLeadIdByEmail(leadEmailId);

      let lead: ILead | null = null;
      if (isNotBlank(leadId)) {
        try {
          lead = await this.sfdcHelper.callToGetExistingSFDCLead(leadId!);
        } catch (ex) {
          console.error(
            `Error while fetching ${leadEmailId} lead by Id to get lead owner for calendar, Exception:`,
            ex,
          );
        }
      } else {
        lead = await this.sfdcHelper.callToSearchLeadByEmail(
          leadEmailId,
          SFDCQueryParamConstants.RETURN_FIELD_BY_OWNER_ID_AND_STATUS_AND_CONVERTED_CONTACT,
        );
        if (lead && isNotBlank(lead.Id)) {
          await this.leadCache.cacheLeadIdByEmail(leadEmailId, lead.Id ?? '');
        }
      }
      return lead;
    }

  private async getContactOwnerIdByContactId(contactId: string): Promise<string | null> {
    try {
      const url = `${env.bizApp.url}/operations/sfdc/findentity/?${SFDCQueryParamConstants.ENTITY_ID}=${contactId}&${SFDCQueryParamConstants.CLASS_TYPE}=Contact`;
      const response = await createAPICall<string>(url, 'GET', constructHttpHeaderWithServiceName());
      if (!response) return null;
      const contact = JSON.parse(response);
      return contact?.ownerId ?? null;
    } catch {
      return null;
    }
  }

  private async getActiveSalesRepEmailBySFDCId(sfdcId: string): Promise<string | null> {
    if (isBlank(sfdcId)) return null;
    try {
      const row = await this.growthDb('sales_rep')
        .where({ sfdc_id: sfdcId, active: true })
        .whereNot('sfdc_role', 'like', '%Executive%')
        .select('email_id')
        .first();
      return row?.email_id ?? null;
    } catch {
      return null;
    }
  }

  private async getSalesRepNameByEmailId(emailId: string): Promise<string | null> {
    try { 
      const row = await this.growthDb('sales_rep').where({ email_id: emailId }).select('name').first();
      return row?.name ?? null;
    } catch {
      return null;
    }
  }

  private async getSalesRepForCalendarBooking(emailId: string): Promise<IBookingSalesRep | null> {
    try {
      const row = await this.growthDb('sales_rep as sr')
        .where({ 'sr.email_id': emailId })
        .select(
          'sr.id as salesRepresentativesId',
          'sr.email_id as emailId',
          'sr.name',
          'sr.sfdc_id as sfdcId',
        )
        .first();
      return row ?? null;
    } catch {
      return null;
    }
  }

  private async getHighPrioritySalesRepBySlug(slug: string, emailIds: string[]): Promise<IBookingSalesRep | null> {
    try {
      const row = await this.growthDb('sales_rep_page_url_mapping as map')
        .join('page_url as pu', 'map.page_url_id', 'pu.id')
        .join('sales_rep as sr', 'map.sales_representatives_id', 'sr.id')
        .where('pu.slug', slug)
        .whereIn('sr.email_id', emailIds)
        .orderBy('map.last_booking_timestamp', 'asc')
        .select(
          'map.sales_representatives_id as salesRepresentativesId',
          'map.page_url_id as pageUrlId',
          'sr.email_id as emailId',
          'sr.name as name',
          'sr.sfdc_id as sfdcId',
          'sr.time_zone as timeZone',
        )
        .first();
      return row ?? null;
    } catch (e) {
      console.error(`Error while fetching high priority sales rep by slug: ${slug}`, e);
      return null;
    }
  }

  private async getHighPrioritySalesRepByType(pageType: string, emailIds: string[]): Promise<IBookingSalesRep | null> {
    try {
      const row = await this.growthDb('sales_rep_page_url_mapping as map')
        .join('page_url as pu', 'map.page_url_id', 'pu.id')
        .join('sales_rep as sr', 'map.sales_representatives_id', 'sr.id')
        .where('pu.type', pageType)
        .whereIn('sr.email_id', emailIds)
        .orderBy('map.last_booking_timestamp', 'asc')
        .select(
          'map.sales_representatives_id as salesRepresentativesId',
          'map.page_url_id as pageUrlId',
          'sr.email_id as emailId',
          'sr.name as name',
          'sr.sfdc_id as sfdcId',
          'sr.time_zone as timeZone',
        )
        .first();
      return row ?? null;
    } catch (e) {
      console.error(`Error while fetching high priority sales rep by type: ${pageType}`, e);
      return null;
    }
  }

  private async updateSalesRepLastBookingTime(repId: number, pageUrlId: number): Promise<void> {
    try {
      await this.growthDb('sales_rep_page_url_mapping')
        .where({ sales_representatives_id: repId, page_url_id: pageUrlId })
        .update({ last_booking_time: new Date() });
    } catch { }
  }

  private async findDistributionTypeBySlug(slug: string): Promise<string | null> {
    const row = await this.growthDb('page_url').where({ slug }).select('distribution_type').first();
    return row?.distribution_type ?? null;
  }

  private async findDistributionTypeByType(type: string): Promise<string | null> {
    const row = await this.growthDb('page_url').where({ type }).select('distribution_type').first();
    return row?.distribution_type ?? null;
  }

  private async findCalendarBookingTemplateBySlug(slug: string): Promise<IPageUrlCalendarBookingTemplateView | null> {
    const row = await this.growthDb('page_url')
      .where({ slug })
      .select('id', 'type', 'slug', 'request_type as requestType', 'meeting_description as meetingDescription',
        'active', 'fallback_calendar as fallbackCalendar', 'segment_assignment_enabled as segmentAssignmentEnabled')
      .first();
    return row ?? null;
  }

  private async findCalendarBookingTemplateByType(type: string): Promise<IPageUrlCalendarBookingTemplateView | null> {
    const row = await this.growthDb('page_url')
      .where({ type })
      .select('id', 'type', 'slug', 'request_type as requestType', 'meeting_description as meetingDescription',
        'active', 'fallback_calendar as fallbackCalendar', 'segment_assignment_enabled as segmentAssignmentEnabled')
      .first();
    return row ?? null;
  }

  private async shouldUseFallBackCalendar(slug: string, visitUrl: string, active: boolean): Promise<boolean> {
    if (!active) return true;
    const emailIds = await this.getAllSalesRepEmailIds(visitUrl, slug);
    return !emailIds?.length;
  }

  private async getAllSalesRepEmailIds(pageName: string, slug: string): Promise<string[]> {
    try {
      let rows: any[];
      if (isNotBlank(slug)) {
        rows = await this.growthDb('sales_rep as sr')
          .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
          .join('page_url as p', 'p.id', 'm.page_url_id')
          .where({ 'sr.active': true, 'p.slug': slug })
          .select('sr.email_id');
      } else {
        rows = await this.growthDb('sales_rep as sr')
          .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
          .join('page_url as p', 'p.id', 'm.page_url_id')
          .where({ 'sr.active': true, 'p.type': pageName })
          .select('sr.email_id');
      }
      return rows.map((r: any) => r.email_id);
    } catch {
      return [];
    }
  }

  private async isChannelLead(industry?: string, fromGoogle?: number): Promise<boolean> {
    if (fromGoogle === 1 && isNotBlank(industry)) {
      const mapped = await this.bazaarifyDb('industries')
        .where({ name: industry, source_id: LeadGenConstants.GOOGLE_SOURCE_ID })
        .first();
      return mapped?.be_main_category === LeadGenConstants.ADVERTISING_MEDIA_AGENCY_BE_CATEGORY;
    }
    return industry === LeadGenConstants.ADVERTISING_MEDIA_AGENCY_BE_CATEGORY;
  }

  private async getRuleForSegmentAndCountry(segment: string, countryCode: string): Promise<any> {
    try {
      return await this.growthDb('calendar_sdr_rules')
        .where({ segment, country: countryCode })
        .first();
    } catch {
      return null;
    }
  }

  private async getRuleByCountry(countryCode: string): Promise<any> {
    try {
      if (['GB', 'AU', 'NZ'].includes(countryCode.toUpperCase())) {
        return await this.growthDb('calendar_sdr_rules')
          .where({ country: countryCode })
          .whereNull('segment')
          .first();
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getRuleForChannel(channel: string): Promise<any> {
    try {
      return await this.growthDb('calendar_sdr_rules').where({ segment: channel }).first();
    } catch {
      return null;
    }
  }

  private async filterSalesRepBySegment(
    pageUrl?: string,
    slug?: string,
    segment?: string,
    organisers: string[] = [],
  ): Promise<string[] | null> {
    try {
      const sfdcRoles = await this.growthDb('sfdc_role_and_location_mapping')
        .where({ segment })
        .pluck('sfdc_role');

      if (sfdcRoles.length) {
        return this.filterSalesRepBySfdcRole(pageUrl, slug, organisers, sfdcRoles);
      }
      return null;
    } catch {
      return null;
    }
  }

  private async findSdrCondition(lead: ILead, businessLocation: string, industry: string): Promise<any> {
    return this.getSDRRules(businessLocation, industry);
  }

  private async getSDRRules(location: string, industry: string): Promise<any> {
    try {
      let resolvedIndustry = '';
      if (isNotBlank(industry)) {
        const mapped = await this.bazaarifyDb('industries')
          .where({ name: industry, source_id: LeadGenConstants.GOOGLE_SOURCE_ID })
          .first();
        if (mapped) {
          resolvedIndustry = mapped.be_main_category;
          if (resolvedIndustry?.toLowerCase() !== 'dental') {
            resolvedIndustry = '';
          }
        }
      }
      return await this.growthDb('calendar_sdr_rules')
        .where(function () {
          this.where('business_location', location);
          if (resolvedIndustry) this.andWhere('industry', resolvedIndustry);
        })
        .first();
    } catch {
      return null;
    }
  }

  private async filterSalesRepEmailsByBusinessLocations(
    businessLocations: string,
    pageUrl?: string,
    slug?: string,
    organisers: string[] = [],
  ): Promise<string[] | null> {
    try {
      let trimmed = businessLocations;
      if (businessLocations.includes('-')) {
        trimmed = businessLocations.substring(0, businessLocations.indexOf('-'));
      } else if (businessLocations.includes('+')) {
        trimmed = businessLocations.substring(0, businessLocations.indexOf('+'));
      }
      const businessLocation = parseInt(trimmed, 10);
      if (isNaN(businessLocation)) return null;

      const mappings = await this.growthDb('sfdc_role_location_mapping')
        .where('location_lower_bound', '<=', businessLocation)
        .andWhere('location_upper_bound', '>=', businessLocation);

      if (mappings.length) {
        const sfdcRoles = mappings.map((m: any) => m.sfdc_role);
        const priorityEmails = await this.filterSalesRepBySfdcRole(pageUrl, slug, organisers, sfdcRoles);
        if (priorityEmails) return priorityEmails;
      }
      return null;
    } catch (e) {
      console.error('Error filtering sales rep emails by business locations:', e);
      return null;
    }
  }

  private async filterSalesRepBySfdcRole(
    pageUrl?: string,
    slug?: string,
    organisers: string[] = [],
    sfdcRoles: string[] = [],
  ): Promise<string[] | null> {
    try {
      let salesReps: any[];
      if (isNotBlank(slug)) {
        salesReps = await this.growthDb('sales_rep as sr')
          .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
          .join('page_url as p', 'p.id', 'm.page_url_id')
          .where({ 'sr.active': true, 'p.slug': slug })
          .whereIn('sr.sfdc_role', sfdcRoles)
          .select('sr.email_id');
      } else {
        salesReps = await this.growthDb('sales_rep as sr')
          .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
          .join('page_url as p', 'p.id', 'm.page_url_id')
          .where({ 'sr.active': true, 'p.type': pageUrl })
          .whereIn('sr.sfdc_role', sfdcRoles)
          .select('sr.email_id');
      }

      if (salesReps.length) {
        const organizerEmails = salesReps.map((sr: any) => sr.email_id);
        const availableOrganisers = new Set(organisers);
        const priority = organizerEmails.filter((e: string) => availableOrganisers.size > 0 && availableOrganisers.has(e));
        return priority.length ? priority : organizerEmails;
      }
      return null;
    } catch (e) {
      console.error('Error filtering sales rep emails by sfdc roles:', e);
      return null;
    }
  }

  private async getPageUrl(contactRequest: IContactRequest): Promise<IPageUrlCalendarBookingTemplateView | null> {
    try {
      if (isNotBlank(contactRequest.slug)) {
        return await this.growthDb('page_url').where({ slug: contactRequest.slug }).first();
      }

      if (!isNotBlank(contactRequest.pageURL)) {
        return null;
      }

      return await this.growthDb('page_url').where({ type: contactRequest.pageURL }).first();
    } catch (e) {
      console.error('Error fetching page URL:', e);
      return null;
    }
  }

  private createCalendarInviteCommonComment(contactRequest: IContactRequest): string {
    if (
      isBlank(contactRequest.eventDate) ||
      isBlank(contactRequest.startTime) ||
      isBlank(contactRequest.endTime)
    ) return '';

    const start = getFormattedCalendarEventDateToDisplay(
      contactRequest.eventDate!,
      contactRequest.startTime!,
      contactRequest.timezone!,
    );
    const end = getFormattedCalendarEventDateToDisplay(
      this.getEventEndDate(contactRequest),
      contactRequest.endTime!,
      contactRequest.timezone!,
    );

    return `${LeadGenConstants.CALENDAR_INVITE_EVENT_START_DATE_TIME_HEADING}${start}\n${LeadGenConstants.CALENDAR_INVITE_EVENT_END_DATE_TIME_HEADING}${end}`;
  }

  private async upsertCalendarBooking(
    existing: ICalendarBooking | null,
    contactRequest: IContactRequest,
    calendarEventRequest: ICalendarEventRequest | null,
    googleResponse: IGoogleCalendarAddEventResponse | null,
    status: BookingStatus,
  ): Promise<ICalendarBooking | null> {
    try {
      const booking: ICalendarBooking = existing ?? {
        contact_request_id: contactRequest.id,
        attendee_email_id: contactRequest.emailId,
        organizer_email_id: this.joinAndTruncate(contactRequest.salesRepEmailIds, 254),
        start_time: this.getFormattedCalendarEventDate(
          contactRequest.eventDate!,
          contactRequest.startTime!,
          contactRequest.timezone!,
        ),
        end_time: this.getFormattedCalendarEventDate(
          contactRequest.eventDate!,
          contactRequest.endTime!,
          contactRequest.timezone!,
        ),
        timezone: contactRequest.timezone,
        lead_campaign: contactRequest.leadCampaign,
        lead_sub_campaign: contactRequest.leadSubCampaign,
        lead_campaignkw: contactRequest.leadCampaignKW,
        lead_sfdc_campaign: contactRequest.leadSfdcCampaign,
        lead_content: contactRequest.leadContent,
        lead_medium: contactRequest.leadMedium,
        lead_url: contactRequest.leadUrl,
        visit_id: contactRequest.visitId,
        session_id: contactRequest.sessionId,
        first_name: contactRequest.firstName,
        last_name: contactRequest.lastName,
        attendee_phone: contactRequest.phone,
        business_name: contactRequest.businessName,
        business_phone: contactRequest.businessPhone,
        user_message: contactRequest.comments,
        additional_attendees: contactRequest.additionalAttendees?.join(','),
        status,
      };

      // Lazily resolve and persist the page reference the first time it's
      // missing, instead of relying on every caller to have already set it.
      if (!booking.page_id) {
        const page = isNotBlank(contactRequest.slug)
          ? await this.growthDb('page_url').where({ slug: contactRequest.slug }).first()
          : await this.growthDb('page_url').where({ type: contactRequest.pageURL }).first();

        if (page) {
          booking.page_id = page.id;
          booking.page_name = page.type;
          booking.page_slug = page.slug;
        }
      }

      if (calendarEventRequest) {
        if (calendarEventRequest.organizerEmailIds?.length) {
          booking.organizer_email_id = this.joinAndTruncate(calendarEventRequest.organizerEmailIds, 254);
        }
        booking.organizer_display_name = calendarEventRequest.organizerDisplayName;
        booking.timezone = calendarEventRequest.timezone;
      }

      if (googleResponse) {
        booking.google_invite_link = googleResponse.htmlLink;
        booking.organizer_email_id = googleResponse.organizerEmailId;
        booking.organizer_sfdc_id = googleResponse.organizerSfdcId;
        booking.meeting_id = googleResponse.meetingId;
        booking.meeting_join_url = googleResponse.meetingJoinUrl;
        booking.meeting_password = googleResponse.meetingPassword;
        booking.event_id = googleResponse.eventId;
        booking.start_time = googleResponse.startTime;
        booking.end_time = googleResponse.endTime;
      }

      booking.status = status;

      if (booking.id) {
        await this.growthDb('calendar_booking').where({ id: booking.id }).update(booking);
      } else {
        const [id] = await this.growthDb('calendar_booking').insert(booking);
        booking.id = id;
      }

      if (isBlank(booking.reschedule_meeting_url)) {
        booking.reschedule_meeting_url = await this.getRescheduleShortenUrl(booking.id!);
        await this.growthDb('calendar_booking')
          .where({ id: booking.id })
          .update({ reschedule_meeting_url: booking.reschedule_meeting_url });
      }

      return booking;
    } catch (e) {
      console.error('Error while saving calendar booking request in DB:', e);
      return null;
    }
  }

  private joinAndTruncate(values: string[] | undefined | null, maxLength: number): string | undefined {
    if (!values?.length) return undefined;
    return values.join(',').substring(0, maxLength);
  }

  private async getRescheduleShortenUrl(bookingId: number): Promise<string> {
    const rescheduleUrl = `${env.calendar.rescheduleUrl}?booking=${encodeURIComponent(String(bookingId))}`;
    return this.getShortenUrl(rescheduleUrl);
  }

  private async getShortenUrl(longUrl: string): Promise<string> {
    try {
      const url = `${env.coreBusiness.freeEndpoint}${APIEndpoints.URL_SHORTEN_API}`;
      const headers = constructHttpHeader();
      headers['Service-Name'] = 'LEADGEN';
      const response = await createAPICall<string>(url, 'POST', headers, longUrl);
      return response ?? '';
    } catch (e) {
      console.error('Error while creating short url:', longUrl, e);
      return '';
    }
  }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}