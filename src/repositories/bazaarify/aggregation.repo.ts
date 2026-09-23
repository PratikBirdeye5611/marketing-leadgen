import { Knex } from "knex";

export interface IAggregationSource {
  id?: number;
  source_alias?: string;
}

export class AggregationSourceRepository {
  constructor(private readonly db: Knex) {}

  async findById(id: number): Promise<IAggregationSource | null> {
    const row = await this.db('aggregation_source').where({ id }).first();
    return row ?? null;
  }
}