import { Knex } from 'knex';

export interface IGenericEmailContactRequest {
  id?: number;
  emailId?: string;
  visitId?: string;
  needReprocess?: boolean;
  reprocessStatus?: string;
  createdAt?: Date;
}

export class GenericEmailContactRequestRepository {
  constructor(private readonly db: Knex) {}

  async save(record: IGenericEmailContactRequest): Promise<IGenericEmailContactRequest> {
    if (record.id) {
      await this.db('generic_email_contact_request').where({ id: record.id }).update(record);
      return record;
    }
    const [id] = await this.db('generic_email_contact_request').insert({
      ...record,
      created_at: record.createdAt ?? new Date(),
    });
    record.id = id;
    return record;
  }

  async saveAll(records: IGenericEmailContactRequest[]): Promise<void> {
    for (const record of records) {
      await this.save(record);
    }
  }

  async findByCreatedAtBetweenAndReprocessStatusIsNull(
    start: Date,
    end: Date,
  ): Promise<IGenericEmailContactRequest[]> {
    return this.db('generic_email_contact_request')
      .whereBetween('created_at', [start, end])
      .whereNull('reprocess_status');
  }
}
