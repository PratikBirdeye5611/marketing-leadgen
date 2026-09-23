import {
  IContactRequestService,
  IContactRequestRecord,
  IRequestContactsRecord,
  IRequestBusinessInfoRecord,
  IRequestLocationRecord,
  IRequestCampaignRecord,
} from '../interfaces/contact-request.service.interface';
import { IContactRequest } from '../../types/contact-request.types';
import { LeadGenConstants } from '../../config/constants';
import { Knex } from 'knex';

export class ContactRequestService implements IContactRequestService {
  constructor(private readonly db: Knex) {}

  async buildAndSaveContactRequest(
    contactRequest: IContactRequest,
    isPartialLeadForm: boolean,
  ): Promise<IContactRequestRecord> {
    return this.db.transaction(async (trx) => {
      const contactRequestRow = await this.upsertContactRequest(trx, contactRequest, isPartialLeadForm);
      const contactRequestId = contactRequestRow.id!;

      await this.upsertRequestContacts(trx, contactRequestId, contactRequest);
      await this.upsertRequestBusinessInfo(trx, contactRequestId, contactRequest);
      await this.upsertRequestLocation(trx, contactRequestId, contactRequest);
      await this.upsertRequestCampaign(trx, contactRequestId, contactRequest);

      return contactRequestRow;
    });
  }

  async findByContactRequestId(id: number): Promise<IContactRequestRecord | null> {
    const row = await this.db('contact_requests').where({ id }).first();
    if (!row) return null;

    const contacts = await this.db('request_contacts').where({ contact_request_id: id }).first();
    const businessInfo = await this.db('request_business_info').where({ contact_request_id: id }).first();
    const location = await this.db('request_location').where({ contact_request_id: id }).first();
    const campaign = await this.db('request_campaign').where({ contact_request_id: id }).first();

    return this.mapRowToRecord(row, contacts, businessInfo, location, campaign);
  }

  async blockAllPriorLeads(contactRequestId: number, emailId: string): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const priorContactIds = await this.db('request_contacts')
      .where({ email_id: emailId.toLowerCase() })
      .pluck('contact_request_id');

    if (!priorContactIds.length) return;

    const priorLeads = await this.db('contact_requests')
      .whereIn('id', priorContactIds)
      .where('id', '<', contactRequestId)
      .whereIn('lead_created', [0, 3])
      .where({ skip_lead: true })
      .where('created_at', '>=', fiveMinutesAgo)
      .pluck('id');

    if (priorLeads.length) {
      await this.db('contact_requests')
        .whereIn('id', priorLeads)
        .update({
          lead_created: LeadGenConstants.SKIP_LEAD_CREATED,
          updated_at: new Date(),
        });
    }
  }

  async setExceptionMessageInContactRequest(
    prefix: string,
    contactRequestId: number,
    error: Error,
  ): Promise<void> {
    await this.db('contact_requests')
      .where({ id: contactRequestId })
      .update({
        error_message: `${prefix} ${error.message}`.substring(0, 1000),
        updated_at: new Date(),
      });
  }

  async flushLeadCreationStatusInContactRequest(
    leadId: string,
    contactRequestId: number,
    leadCreatedStatus: number,
    _emailId: string,
    existingLeadStatus?: string,
    sfdcContactId?: string,
  ): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx('contact_requests').where({ id: contactRequestId }).update({
        lead_created: leadCreatedStatus,
        existing_lead_status: existingLeadStatus,
        updated_at: new Date(),
      });

      const existingLead = await trx('leads').where({ contact_request_id: contactRequestId }).first();
      if (existingLead) {
        await trx('leads').where({ contact_request_id: contactRequestId }).update({
          sfdc_lead_id: leadId,
          sfdc_contact_id: sfdcContactId,
          updated_at: new Date(),
        });
      } else {
        await trx('leads').insert({
          contact_request_id: contactRequestId,
          sfdc_lead_id: leadId,
          sfdc_contact_id: sfdcContactId,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    });
  }

  async getContactRequests(start: string, end: string): Promise<IContactRequestRecord[]> {
    const rows = await this.db('contact_requests')
      .whereBetween('created_at', [new Date(start), new Date(end)]);
    return rows.map((row: Record<string, unknown>) => this.mapRowToRecord(row, null, null, null, null));
  }

  private async upsertContactRequest(
    trx: Knex.Transaction,
    contactRequest: IContactRequest,
    isPartialLeadForm: boolean,
  ): Promise<IContactRequestRecord> {
    const data = {
      request_type: contactRequest.requestType ?? 'contact',
      form_fill_type: contactRequest.formFillType ?? 'MANUAL',
      visit_id: contactRequest.visitId,
      session_id: contactRequest.sessionId,
      form_fill_id: contactRequest.formFillId,
      remote_ip_address: contactRequest.remoteIp,
      device_name: contactRequest.deviceName,
      be_cta: contactRequest.beCta,
      experiment_names: contactRequest.croExperiments?.join(','),
      ad_click_id: contactRequest.adClickId,
      click_page_type: contactRequest.clickPageType,
      lead_page_type: contactRequest.leadPageType,
      click_url: contactRequest.clickUrl,
      lead_url: contactRequest.leadUrl,
      comments: contactRequest.comments,
      profile_url: contactRequest.profileUrl,
      from_google: contactRequest.fromGoogle ?? 0,
      skip_lead: isPartialLeadForm ? true : (contactRequest.skipLead ?? false),
      lead_created: contactRequest.supportSkipLead
        ? LeadGenConstants.SUPPORT_SKIP_LEAD_CREATED
        : LeadGenConstants.DEFAULT_LEAD_CREATED,
      aggregation_completed: 0,
    };

    if (contactRequest.id) {
      await trx('contact_requests').where({ id: contactRequest.id }).update({
        ...data,
        updated_at: new Date(),
      });
      return { id: contactRequest.id, ...data };
    }

    const [id] = await trx('contact_requests').insert({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { id, ...data, createdAt: new Date() };
  }

  private async upsertRequestContacts(
    trx: Knex.Transaction,
    contactRequestId: number,
    contactRequest: IContactRequest,
  ): Promise<void> {
    const data = {
      first_name: contactRequest.firstName,
      last_name: contactRequest.lastName,
      email_id: contactRequest.emailId?.toLowerCase(),
      phone: contactRequest.phone,
      mobile_phone: contactRequest.mobilePhone,
    };

    const existing = await trx('request_contacts').where({ contact_request_id: contactRequestId }).first();
    if (existing) {
      await trx('request_contacts').where({ contact_request_id: contactRequestId }).update(data);
    } else {
      await trx('request_contacts').insert({ contact_request_id: contactRequestId, ...data });
    }
  }

  private async upsertRequestBusinessInfo(
    trx: Knex.Transaction,
    contactRequestId: number,
    contactRequest: IContactRequest,
  ): Promise<void> {
    const data = {
      business_name: contactRequest.businessName,
      business_phone: contactRequest.businessPhone,
      business_number: contactRequest.businessNumber,
      business_locations: contactRequest.businessLocations,
      business_employees: contactRequest.businessEmployees,
      number_of_employees: contactRequest.numberOfEmployees,
      monthly_customers: contactRequest.monthlyCustomers,
      industry: contactRequest.industry,
      source_industry: contactRequest.sourceIndustry,
      annual_revenue: contactRequest.annualRevenue,
      monthly_expenditure: contactRequest.customerMonthlyExpenditure,
      products: contactRequest.productToSell?.join(','),
      product_of_interest: contactRequest.productOfInterest?.join(','),
      locations_under_management: contactRequest.locationsUnderManagement,
      website: contactRequest.website?.substring(0, 500),
      business_env: contactRequest.businessEnv,
      crm_info: contactRequest.crmInfo,
      crm_name: contactRequest.crmName,
      scan_report_url: contactRequest.scanReportUrl,
    };

    const existing = await trx('request_business_info').where({ contact_request_id: contactRequestId }).first();
    if (existing) {
      await trx('request_business_info').where({ contact_request_id: contactRequestId }).update(data);
    } else {
      await trx('request_business_info').insert({ contact_request_id: contactRequestId, ...data });
    }
  }

  private async upsertRequestLocation(
    trx: Knex.Transaction,
    contactRequestId: number,
    contactRequest: IContactRequest,
  ): Promise<void> {
    const data = {
      zip: contactRequest.zip,
      street: contactRequest.street,
      city: contactRequest.city,
      state: contactRequest.state,
      country: contactRequest.country,
      country_code: contactRequest.countryCode,
      latitude: contactRequest.latitude,
      longitude: contactRequest.longitude,
      place_id: contactRequest.placeId,
      google_rating: contactRequest.googleRating,
      google_review_count: contactRequest.googleReviewCount,
    };

    const existing = await trx('request_location').where({ contact_request_id: contactRequestId }).first();
    if (existing) {
      await trx('request_location').where({ contact_request_id: contactRequestId }).update(data);
    } else {
      await trx('request_location').insert({ contact_request_id: contactRequestId, ...data });
    }
  }

  private async upsertRequestCampaign(
    trx: Knex.Transaction,
    contactRequestId: number,
    contactRequest: IContactRequest,
  ): Promise<void> {
    const data = {
      lead_campaign: contactRequest.leadCampaign,
      lead_sub_campaign: contactRequest.leadSubCampaign,
      lead_campaign_kw: contactRequest.leadCampaignKW,
      lead_content: contactRequest.leadContent,
      lead_medium: contactRequest.leadMedium,
      lead_source: contactRequest.leadSource,
      lead_sfdc_campaign: contactRequest.leadSfdcCampaign,
      intent: contactRequest.intent,
      buying_intent: contactRequest.buyingIntent,
    };

    const existing = await trx('request_campaign').where({ contact_request_id: contactRequestId }).first();
    if (existing) {
      await trx('request_campaign').where({ contact_request_id: contactRequestId }).update(data);
    } else {
      await trx('request_campaign').insert({ contact_request_id: contactRequestId, ...data });
    }
  }

  private mapRowToRecord(
    row: Record<string, unknown> | null,
    contacts: Record<string, unknown> | null,
    businessInfo: Record<string, unknown> | null,
    location: Record<string, unknown> | null,
    campaign: Record<string, unknown> | null,
  ): IContactRequestRecord {
    if (!row) return {};
    return {
      id: row.id as number,
      requestType: row.request_type as string,
      formFillType: row.form_fill_type as string,
      visitId: row.visit_id as string,
      sessionId: row.session_id as string,
      formFillId: row.form_fill_id as string,
      remoteIpAddress: row.remote_ip_address as string,
      deviceName: row.device_name as string,
      beCta: row.be_cta as string,
      experimentNames: row.experiment_names as string,
      adClickId: row.ad_click_id as string,
      clickPageType: row.click_page_type as string,
      leadPageType: row.lead_page_type as string,
      clickUrl: row.click_url as string,
      leadUrl: row.lead_url as string,
      comments: row.comments as string,
      profileUrl: row.profile_url as string,
      errorMessage: row.error_message as string,
      existingLeadStatus: row.existing_lead_status as string,
      leadCreated: row.lead_created as number,
      skipLead: row.skip_lead as boolean,
      fromGoogle: row.from_google as number,
      aggregationCompleted: row.aggregation_completed as number,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      contacts: contacts ? {
        id: contacts.id as number,
        contactRequestId: contacts.contact_request_id as number,
        firstName: contacts.first_name as string,
        lastName: contacts.last_name as string,
        emailId: contacts.email_id as string,
        phone: contacts.phone as string,
        mobilePhone: contacts.mobile_phone as string,
      } : undefined,
      businessInfo: businessInfo ? {
        id: businessInfo.id as number,
        contactRequestId: businessInfo.contact_request_id as number,
        businessName: businessInfo.business_name as string,
        businessPhone: businessInfo.business_phone as string,
        businessNumber: businessInfo.business_number as string,
        businessLocations: businessInfo.business_locations as string,
        businessEmployees: businessInfo.business_employees as string,
        numberOfEmployees: businessInfo.number_of_employees as number,
        monthlyCustomers: businessInfo.monthly_customers as string,
        industry: businessInfo.industry as string,
        sourceIndustry: businessInfo.source_industry as string,
        annualRevenue: businessInfo.annual_revenue as number,
        monthlyExpenditure: businessInfo.monthly_expenditure as string,
        products: businessInfo.products as string,
        productOfInterest: businessInfo.product_of_interest as string,
        locationsUnderManagement: businessInfo.locations_under_management as string,
        website: businessInfo.website as string,
        businessEnv: businessInfo.business_env as string,
        crmInfo: businessInfo.crm_info as string,
        crmName: businessInfo.crm_name as string,
        scanReportUrl: businessInfo.scan_report_url as string,
      } : undefined,
      location: location ? {
        id: location.id as number,
        contactRequestId: location.contact_request_id as number,
        zip: location.zip as string,
        street: location.street as string,
        city: location.city as string,
        state: location.state as string,
        country: location.country as string,
        countryCode: location.country_code as string,
        latitude: location.latitude as number,
        longitude: location.longitude as number,
        placeId: location.place_id as string,
        googleRating: location.google_rating as number,
        googleReviewCount: location.google_review_count as number,
      } : undefined,
      campaign: campaign ? {
        id: campaign.id as number,
        contactRequestId: campaign.contact_request_id as number,
        leadCampaign: campaign.lead_campaign as string,
        leadSubCampaign: campaign.lead_sub_campaign as string,
        leadCampaignKw: campaign.lead_campaign_kw as string,
        leadContent: campaign.lead_content as string,
        leadMedium: campaign.lead_medium as string,
        leadSource: campaign.lead_source as string,
        leadSfdcCampaign: campaign.lead_sfdc_campaign as string,
        intent: campaign.intent as string,
        buyingIntent: campaign.buying_intent as string,
      } : undefined,
    };
  }
}
