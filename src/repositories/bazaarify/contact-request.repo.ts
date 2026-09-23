import { Knex } from 'knex';
import { IContactRequestRecord } from '../../services/interfaces/contact-request.service.interface';

export class ContactRequestRepository {
  constructor(private readonly db: Knex) {}

  async findById(id: number): Promise<IContactRequestRecord | null> {
    const row = await this.db('contact_requests').where({ id }).first();
    return row ?? null;
  }

  async updateLeadCreated(id: number, leadCreated: number): Promise<void> {
    await this.db('contact_requests').where({ id }).update({
      lead_created: leadCreated,
      updated_at: new Date(),
    });
  }

  async updateErrorMessage(id: number, errorMessage: string): Promise<void> {
    await this.db('contact_requests').where({ id }).update({
      error_message: errorMessage.substring(0, 1000),
      updated_at: new Date(),
    });
  }

  async updateAggregationCompleted(id: number, value: number): Promise<void> {
    await this.db('contact_requests').where({ id }).update({
      aggregation_completed: value,
      updated_at: new Date(),
    });
  }

  async findByLeadCreatedAndCreatedAtBefore(
    leadCreated: number,
    before: Date,
  ): Promise<IContactRequestRecord[]> {
    return this.db('contact_requests')
      .where({ lead_created: leadCreated })
      .where('created_at', '<', before);
  }

  async findByLeadCreatedInAndCreatedAtBetween(
    leadCreatedValues: number[],
    from: Date,
    to: Date,
  ): Promise<IContactRequestRecord[]> {
    return this.db('contact_requests')
      .whereIn('lead_created', leadCreatedValues)
      .whereBetween('created_at', [from, to]);
  }

  async findBetweenDates(start: Date, end: Date): Promise<IContactRequestRecord[]> {
    return this.db('contact_requests').whereBetween('created_at', [start, end]);
  }

  async findWithLeadCreatedBetweenDates(
    start: Date,
    end: Date,
  ): Promise<IContactRequestRecord[]> {
    return this.db('contact_requests')
      .where({ lead_created: 1 })
      .whereBetween('created_at', [start, end]);
  }
}
