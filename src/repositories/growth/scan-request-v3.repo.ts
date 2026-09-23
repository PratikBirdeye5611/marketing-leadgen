import { Knex } from 'knex';

export interface IScanRequestV3 {
  id?: number;
  scan_request_id: string;
  b_id?: number;
  business_id?: number;
  business_name?: string;
  phone?: string;
  user_email?: string;
  zip?: string;
  address?: string;
  google_industry?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  partner_id?: number;
  scan_type?: string;
  env?: string;
  listing_status?: string;
  local_ranking_status?: string;
  reputation_status?: string;
  reputation_summary_status?: string;
  reputation_retry_count?: number;
  show_cta?: boolean;
  create_lead?: boolean;
  report_mail_sent_flag?: boolean;
  len_mail_sent_flag?: boolean;
  account_type?: string;
  presence_opted?: number;
  activation_status?: string;
  error_message?: string;
  city?: string;
  state?: string;
  country_code?: string;
  country_name?: string;
  online_listings_url?: string;
  user_first_name?: string;
  user_last_name?: string;
  industry_keyword?: string;
  report_url?: string;
  last_refresh_date?: Date;
  region?: string;
  date_added?: Date;
  date_modified?: Date;
}

export class ScanRequestV3Repository {
  constructor(private readonly db: Knex) {}

  async findByScanRequestId(scanRequestId: string): Promise<IScanRequestV3 | null> {
    const row = await this.db('scan_request_v3').where({ scan_request_id: scanRequestId }).first();
    return row ?? null;
  }

  async findLenRequestsByMailSentFlag(lenMailSentFlag: boolean): Promise<IScanRequestV3[]> {
    return this.db('scan_request_v3').where({ scan_type: 'LEN_PAGE_SCAN', len_mail_sent_flag: lenMailSentFlag });
  }

  async findByPlaceIdAndUserEmail(placeId: string, userEmail: string): Promise<IScanRequestV3[]> {
    return this.db('scan_request_v3').where({ place_id: placeId, user_email: userEmail });
  }

  async findByBusinessNameAndPhoneAndZipAndUserEmail(
    businessName: string,
    phone: string,
    zip: string,
    userEmail: string,
  ): Promise<IScanRequestV3[]> {
    return this.db('scan_request_v3').where({
      business_name: businessName,
      phone,
      zip,
      user_email: userEmail,
    });
  }

  async save(entity: IScanRequestV3): Promise<IScanRequestV3> {
    const now = new Date();
    if (entity.id) {
      await this.db('scan_request_v3').where({ id: entity.id }).update({ ...entity, date_modified: now });
      const row = await this.db('scan_request_v3').where({ id: entity.id }).first();
      return row!;
    }
    const [id] = await this.db('scan_request_v3').insert({ ...entity, date_added: now, date_modified: now });
    const row = await this.db('scan_request_v3').where({ id }).first();
    return row!;
  }
}