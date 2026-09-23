import { Knex } from 'knex';
import { IRequestCampaignRecord } from '../../services/interfaces/contact-request.service.interface';

export class RequestCampaignRepository {
  constructor(private readonly db: Knex) {}

  async upsert(contactRequestId: number, data: Omit<IRequestCampaignRecord, 'id' | 'contactRequestId'>): Promise<void> {
    const existing = await this.db('request_campaign').where({ contact_request_id: contactRequestId }).first();
    const row = {
      lead_campaign: data.leadCampaign,
      lead_sub_campaign: data.leadSubCampaign,
      lead_campaign_kw: data.leadCampaignKw,
      lead_content: data.leadContent,
      lead_medium: data.leadMedium,
      lead_source: data.leadSource,
      lead_sfdc_campaign: data.leadSfdcCampaign,
      intent: data.intent,
      buying_intent: data.buyingIntent,
    };

    if (existing) {
      await this.db('request_campaign').where({ contact_request_id: contactRequestId }).update(row);
    } else {
      await this.db('request_campaign').insert({ contact_request_id: contactRequestId, ...row });
    }
  }

  async findByContactRequestId(contactRequestId: number): Promise<IRequestCampaignRecord | null> {
    const row = await this.db('request_campaign').where({ contact_request_id: contactRequestId }).first();
    if (!row) return null;
    return {
      id: row.id,
      contactRequestId: row.contact_request_id,
      leadCampaign: row.lead_campaign,
      leadSubCampaign: row.lead_sub_campaign,
      leadCampaignKw: row.lead_campaign_kw,
      leadContent: row.lead_content,
      leadMedium: row.lead_medium,
      leadSource: row.lead_source,
      leadSfdcCampaign: row.lead_sfdc_campaign,
      intent: row.intent,
      buyingIntent: row.buying_intent,
    };
  }
}
