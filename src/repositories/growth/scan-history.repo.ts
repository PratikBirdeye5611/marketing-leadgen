import { Knex } from 'knex';

export interface IScanHistory {
  id?: number;
  scan_request_id: string;
  business_id: number;
  env: string;
  date_added?: Date;
  date_modified?: Date;
}

export class ScanHistoryRepository {
  constructor(private readonly db: Knex) {}

  async save(entity: IScanHistory): Promise<IScanHistory> {
    const now = new Date();
    const [id] = await this.db('scan_history').insert({ ...entity, date_added: now, date_modified: now });
    const row = await this.db('scan_history').where({ id }).first();
    return row!;
  }
}