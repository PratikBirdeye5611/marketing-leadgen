import { Knex } from 'knex';

export interface IIndustries {
  id?: number;
  name: string;
  be_main_category?: string;
  be_parent_category_id?: number;
  be_sub_category?: string;
  be_category_id?: number;
  source_id: number;
}

export class IndustriesRepository {
  constructor(private readonly db: Knex) {}

  async findByNameAndSourceId(name: string, sourceId: number): Promise<IIndustries | null> {
    const row = await this.db('industries').where({ name, source_id: sourceId }).first();
    return row ?? null;
  }

  async findByNameInAndSourceId(names: string[], sourceId: number): Promise<IIndustries[]> {
    return this.db('industries').whereIn('name', names).andWhere({ source_id: sourceId });
  }
}