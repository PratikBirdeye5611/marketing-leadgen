import { Knex } from 'knex';
import { ISfdcRoleAndLocationMapping } from '../../types/calendar.types';

export class SfdcRoleLocationMappingRepository {
  constructor(private readonly db: Knex) {}

  async findBySegment(segment: string): Promise<string[]> {
    const rows = await this.db('sfdc_role_and_location_mapping')
      .where({ segment })
      .pluck('sfdc_role');
    return rows;
  }

  async findByLocation(location: number): Promise<ISfdcRoleAndLocationMapping[]> {
    const rows = await this.db('sfdc_role_and_location_mapping')
      .where('location', '<=', location)
      .orderBy('location', 'desc');
    return rows;
  }
}
