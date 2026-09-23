import { Knex } from 'knex';
import { IMarketoNewsletterSubscription } from '../../types/marketo.types';

export class MarketoNewsletterRepository {
  constructor(private readonly db: Knex) {}

  async save(record: IMarketoNewsletterSubscription): Promise<IMarketoNewsletterSubscription> {
    if (record.id) {
      await this.db('marketo_newsletter_subscription').where({ id: record.id }).update(record);
      return record;
    }
    const [id] = await this.db('marketo_newsletter_subscription').insert(record);
    record.id = id;
    return record;
  }

  async findByMarketoId(marketoId: number): Promise<IMarketoNewsletterSubscription | null> {
    const row = await this.db('marketo_newsletter_subscription')
      .where({ marketo_id: marketoId })
      .first();
    return row ?? null;
  }

  async findByEmail(email: string): Promise<IMarketoNewsletterSubscription | null> {
    const row = await this.db('marketo_newsletter_subscription')
      .where({ email })
      .first();
    return row ?? null;
  }
}
