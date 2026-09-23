import { Knex } from 'knex';

export interface IBusiness {
  account_type?: string;
  location_id?: number;
  type?: string;
  reseller_id?: number;
  enterprise_id?: number;
  id?: number;
  updated?: Date;
  created?: Date;
  mail_resend_frequency?: number;
  last_scan_date?: Date;
  last_dup_check_date?: Date;
  reviews_scrapped?: number;
  business_id?: number;
  activation_status?: string;
  name?: string;
  phone?: string;
  fax?: string;
  email_id?: string;
  bazaarify_email_id?: string;
  website_url?: string;
  description?: string;
  keywords?: string;
  services?: string;
  logo_url?: string;
  review_agg_repeat_hours?: number;
}

export class BusinessRepository {
  constructor(private readonly db: Knex) {}

  async findByBusinessId(businessId: number): Promise<IBusiness | null> {
    const row = await this.db('business').where({ business_id: businessId }).first();
    return row ?? null;
  }

  async findById(id: number): Promise<IBusiness | null> {
    const row = await this.db('business').where({ id }).first();
    return row ?? null;
  }

  async findByNameAndPhoneAndZip(
    name: string,
    phone: string,
    zip: string,
  ): Promise<IBusiness[]> {
    return this.db('business as b')
      .join('location as l', 'l.id', 'b.location_id')
      .where({ 'b.name': name })
      .where({ 'l.zip': zip })
      .select('b.*');
  }
}
