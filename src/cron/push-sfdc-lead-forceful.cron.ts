import cron from 'node-cron';
import { Knex } from 'knex';
import { ICreateLeadService } from '../services/interfaces/create-lead.service.interface';
import { IContactRequest } from '../types/contact-request.types';
import { LeadGenConstants } from '../config/constants';

export function startPushSFDCLeadForcefulCron(
  db: Knex,
  createLeadService: ICreateLeadService,
): ReturnType<typeof cron.schedule> {
  return cron.schedule('*/5 * * * *', async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const rows = await db('contact_requests')
        .where({ lead_created: LeadGenConstants.DEFAULT_LEAD_CREATED })
        .where('created_at', '<', fiveMinutesAgo)
        .select('id');

      if (!rows.length) return;

      const contactRequestIds: number[] = rows.map((r: { id: number }) => r.id);

      for (const contactRequestId of contactRequestIds) {
        try {
          const contacts = await db('request_contacts')
            .where({ contact_request_id: contactRequestId })
            .first();

          const businessInfo = await db('request_business_info')
            .where({ contact_request_id: contactRequestId })
            .first();

          const location = await db('request_location')
            .where({ contact_request_id: contactRequestId })
            .first();

          const campaign = await db('request_campaign')
            .where({ contact_request_id: contactRequestId })
            .first();

          const base = await db('contact_requests')
            .where({ id: contactRequestId })
            .first();

          const message: IContactRequest = {
            id: contactRequestId,
            emailId: contacts?.email_id,
            firstName: contacts?.first_name,
            lastName: contacts?.last_name,
            phone: contacts?.phone,
            mobilePhone: contacts?.mobile_phone,
            businessName: businessInfo?.business_name,
            businessPhone: businessInfo?.business_phone,
            businessNumber: businessInfo?.business_number,
            industry: businessInfo?.industry,
            website: businessInfo?.website,
            street: location?.street,
            city: location?.city,
            state: location?.state,
            country: location?.country,
            countryCode: location?.country_code,
            zip: location?.zip,
            latitude: location?.latitude,
            longitude: location?.longitude,
            placeId: location?.place_id,
            leadCampaign: campaign?.lead_campaign,
            leadSubCampaign: campaign?.lead_sub_campaign,
            leadCampaignKW: campaign?.lead_campaign_kw,
            leadSource: campaign?.lead_source,
            requestType: base?.request_type,
            fromGoogle: base?.from_google,
            visitId: base?.visit_id,
            sessionId: base?.session_id,
            forcefulLead: true,
          };

          await createLeadService.leadCreationAndFollowingOperations(message);
        } catch (error) {
          console.error(
            `Exception while pushing SFDC lead forcefully for contactRequestId: ${contactRequestId}`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error in pushSFDCLeadForceful cron:', error);
    }
  });
}
