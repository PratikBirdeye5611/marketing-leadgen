import { Knex } from 'knex';
import { IRequestContactsRecord } from '../../services/interfaces/contact-request.service.interface';

export class RequestContactsRepository {
  constructor(private readonly db: Knex) {}

  async upsert(contactRequestId: number, data: Omit<IRequestContactsRecord, 'id' | 'contactRequestId'>): Promise<void> {
    const existing = await this.db('request_contacts').where({ contact_request_id: contactRequestId }).first();
    if (existing) {
      await this.db('request_contacts').where({ contact_request_id: contactRequestId }).update({
        first_name: data.firstName,
        last_name: data.lastName,
        email_id: data.emailId?.toLowerCase(),
        phone: data.phone,
        mobile_phone: data.mobilePhone,
      });
    } else {
      await this.db('request_contacts').insert({
        contact_request_id: contactRequestId,
        first_name: data.firstName,
        last_name: data.lastName,
        email_id: data.emailId?.toLowerCase(),
        phone: data.phone,
        mobile_phone: data.mobilePhone,
      });
    }
  }

  async findByContactRequestId(contactRequestId: number): Promise<IRequestContactsRecord | null> {
    const row = await this.db('request_contacts').where({ contact_request_id: contactRequestId }).first();
    if (!row) return null;
    return {
      id: row.id,
      contactRequestId: row.contact_request_id,
      firstName: row.first_name,
      lastName: row.last_name,
      emailId: row.email_id,
      phone: row.phone,
      mobilePhone: row.mobile_phone,
    };
  }

  async findByEmailId(emailId: string): Promise<IRequestContactsRecord[]> {
    const rows = await this.db('request_contacts').where({ email_id: emailId.toLowerCase() });
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      contactRequestId: row.contact_request_id as number,
      firstName: row.first_name as string,
      lastName: row.last_name as string,
      emailId: row.email_id as string,
      phone: row.phone as string,
      mobilePhone: row.mobile_phone as string,
    }));
  }

  async updatePhone(contactRequestId: number, phone: string, mobilePhone: string): Promise<void> {
    await this.db('request_contacts').where({ contact_request_id: contactRequestId }).update({
      phone,
      mobile_phone: mobilePhone,
    });
  }
}
