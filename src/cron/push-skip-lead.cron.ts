import cron from 'node-cron';
import { Knex } from 'knex';
import { ICreateLeadService } from '../services/interfaces/create-lead.service.interface';
import { IContactRequest } from '../types/contact-request.types';

const LEAD_CREATED_VALUES = [0, 3];
const COOLING_PERIOD_SECONDS = 300;

export function startPushSkipLeadCron(
  db: Knex,
  createLeadService: ICreateLeadService,
): ReturnType<typeof cron.schedule> {
  return cron.schedule('*/1 * * * *', async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const coolingPeriodAgo = new Date(now.getTime() - COOLING_PERIOD_SECONDS * 1000);

      const rows = await db('contact_requests')
        .whereIn('lead_created', LEAD_CREATED_VALUES)
        .where('created_at', '>=', fiveMinutesAgo)
        .where('created_at', '<=', coolingPeriodAgo)
        .select('id');

      if (!rows.length) return;

      for (const row of rows) {
        try {
          const contactRequestId: number = row.id;

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
            numberOfEmployees: businessInfo?.number_of_employees,
            annualRevenue: businessInfo?.annual_revenue,
            businessLocations: businessInfo?.business_locations,
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
            leadContent: campaign?.lead_content,
            leadMedium: campaign?.lead_medium,
            leadSource: campaign?.lead_source,
            leadSfdcCampaign: campaign?.lead_sfdc_campaign,
            intent: campaign?.intent,
            buyingIntent: campaign?.buying_intent,
            requestType: base?.request_type,
            fromGoogle: base?.from_google,
            visitId: base?.visit_id,
            sessionId: base?.session_id,
            formFillId: base?.form_fill_id,
            remoteIp: base?.remote_ip_address,
            comments: base?.comments,
            profileUrl: base?.profile_url,
            skipLead: base?.skip_lead,
          };

          await createLeadService.leadCreationAndFollowingOperations(message);
        } catch (error) {
          console.error(
            `Exception while pushing skip lead for contactRequestId: ${row.id}`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error in pushSkipLead cron:', error);
    }
  });
}
