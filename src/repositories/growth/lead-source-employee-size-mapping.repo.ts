import { Knex } from 'knex';

export interface ILeadSourceEmployeeSizeMapping {
  id?: number;
  employeeSize?: string;
  leadEmployeeSize?: string;
  numberOfEmployees?: number;
  sourceName?: string;
}

export class LeadSourceEmployeeSizeMappingRepository {
  constructor(private readonly db: Knex) {}

  async findByEmployeeSizeAndSourceName(
    employeeSize: string,
    sourceName: string,
  ): Promise<ILeadSourceEmployeeSizeMapping | null> {
    const row = await this.db('lead_source_employee_size_mapping as m')
      .join('lead_source as s', 's.id', 'm.lead_source_id')
      .join('lead_employee_size as e', 'e.id', 'm.lead_employee_size_id')
      .where({ 'm.employee_size': employeeSize, 's.source_name': sourceName })
      .select(
        'm.id',
        'm.employee_size as employeeSize',
        'e.employee_size as leadEmployeeSize',
        'e.number_of_employees as numberOfEmployees',
        's.source_name as sourceName',
      )
      .first();
    return row ?? null;
  }
}
