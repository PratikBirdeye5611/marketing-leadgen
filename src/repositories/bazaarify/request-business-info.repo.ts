import { Knex } from 'knex';
import { IRequestBusinessInfoRecord } from '../../services/interfaces/contact-request.service.interface';

export class RequestBusinessInfoRepository {
  constructor(private readonly db: Knex) {}

  async upsert(contactRequestId: number, data: Omit<IRequestBusinessInfoRecord, 'id' | 'contactRequestId'>): Promise<void> {
    const existing = await this.db('request_business_info').where({ contact_request_id: contactRequestId }).first();
    const row = {
      business_name: data.businessName,
      business_phone: data.businessPhone,
      business_number: data.businessNumber,
      business_locations: data.businessLocations,
      business_employees: data.businessEmployees,
      number_of_employees: data.numberOfEmployees,
      monthly_customers: data.monthlyCustomers,
      industry: data.industry,
      source_industry: data.sourceIndustry,
      annual_revenue: data.annualRevenue,
      monthly_expenditure: data.monthlyExpenditure,
      products: data.products,
      product_of_interest: data.productOfInterest,
      locations_under_management: data.locationsUnderManagement,
      website: data.website?.substring(0, 500),
      business_env: data.businessEnv,
      crm_info: data.crmInfo,
      crm_name: data.crmName,
      scan_report_url: data.scanReportUrl,
    };

    if (existing) {
      await this.db('request_business_info').where({ contact_request_id: contactRequestId }).update(row);
    } else {
      await this.db('request_business_info').insert({ contact_request_id: contactRequestId, ...row });
    }
  }

  async findByContactRequestId(contactRequestId: number): Promise<IRequestBusinessInfoRecord | null> {
    const row = await this.db('request_business_info').where({ contact_request_id: contactRequestId }).first();
    if (!row) return null;
    return {
      id: row.id,
      contactRequestId: row.contact_request_id,
      businessName: row.business_name,
      businessPhone: row.business_phone,
      businessNumber: row.business_number,
      businessLocations: row.business_locations,
      businessEmployees: row.business_employees,
      numberOfEmployees: row.number_of_employees,
      monthlyCustomers: row.monthly_customers,
      industry: row.industry,
      sourceIndustry: row.source_industry,
      annualRevenue: row.annual_revenue,
      monthlyExpenditure: row.monthly_expenditure,
      products: row.products,
      productOfInterest: row.product_of_interest,
      locationsUnderManagement: row.locations_under_management,
      website: row.website,
      businessEnv: row.business_env,
      crmInfo: row.crm_info,
      crmName: row.crm_name,
      scanReportUrl: row.scan_report_url,
    };
  }

  async updateScanReportUrl(contactRequestId: number, scanReportUrl: string): Promise<void> {
    await this.db('request_business_info')
      .where({ contact_request_id: contactRequestId })
      .update({ scan_report_url: scanReportUrl });
  }

  async updateIndustry(
    contactRequestId: number,
    industry: string,
    sourceIndustry?: string,
  ): Promise<void> {
    await this.db('request_business_info')
      .where({ contact_request_id: contactRequestId })
      .update({ industry, source_industry: sourceIndustry });
  }
}
