import { Knex } from 'knex';

export interface IScanIndustryHistory {
  id?: number;
  scan_request_id: string;
  business_id: number;
  env: string;
  google_industry: string;
  date_added?: Date;
  date_modified?: Date;
}

export class ScanIndustryHistoryRepository {
  constructor(private readonly db: Knex) {}

  async findByDateAddedBusinessIdAndEnv(dateAdded: Date, businessId: number, env: string): Promise<string[]> {
    const rows = await this.db('scan_industry_history')
      .distinct('google_industry')
      .where('date_added', '>=', dateAdded)
      .andWhere({ business_id: businessId, env });
    return rows.map((r: any) => r.google_industry);
  }

  async save(entity: IScanIndustryHistory): Promise<IScanIndustryHistory> {
    const now = new Date();
    const [id] = await this.db('scan_industry_history').insert({ ...entity, date_added: now, date_modified: now });
    const row = await this.db('scan_industry_history').where({ id }).first();
    return row!;
  }
}