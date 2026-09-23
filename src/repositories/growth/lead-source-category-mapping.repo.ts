import { Knex } from 'knex';

export interface ILeadSourceCategoryMapping {
  id?: number;
  categoryName?: string;
  leadCategoryName?: string;
  leadSubCategoryName?: string;
  sourceName?: string;
}

export class LeadSourceCategoryMappingRepository {
  constructor(private readonly db: Knex) {}

  async findByCategoryNameAndSourceName(
    categoryName: string,
    sourceName: string,
  ): Promise<ILeadSourceCategoryMapping | null> {
    const row = await this.db('lead_source_category_mapping as m')
      .join('lead_source as s', 's.id', 'm.lead_source_id')
      .join('lead_category as c', 'c.id', 'm.lead_category_id')
      .where({ 'm.category_name': categoryName, 's.source_name': sourceName })
      .select(
        'm.id',
        'm.category_name as categoryName',
        'c.category_name as leadCategoryName',
        'c.sub_category_name as leadSubCategoryName',
        's.source_name as sourceName',
      )
      .first();
    return row ?? null;
  }
}
