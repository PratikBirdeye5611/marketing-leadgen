import { Knex } from 'knex';

export interface IScanLimit {
  id?: number;
  reseller_id: number;
  scan_limit_value: number;
  date_added?: Date;
  date_modified?: Date;
}

export class ScanLimitRepository {
  constructor(private readonly db: Knex) {}

  async findByResellerId(resellerId: number): Promise<IScanLimit | null> {
    const row = await this.db('scan_limit').where({ reseller_id: resellerId }).first();
    return row ?? null;
  }

  async save(entity: IScanLimit): Promise<IScanLimit> {
    const now = new Date();
    if (entity.id) {
      await this.db('scan_limit').where({ id: entity.id }).update({ scan_limit_value: entity.scan_limit_value, date_modified: now });
      const row = await this.db('scan_limit').where({ id: entity.id }).first();
      return row!;
    }
    const [id] = await this.db('scan_limit').insert({ ...entity, date_added: now, date_modified: now });
    const row = await this.db('scan_limit').where({ id }).first();
    return row!;
  }
}