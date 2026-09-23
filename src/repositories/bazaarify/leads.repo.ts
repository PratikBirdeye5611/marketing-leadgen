import { Knex } from 'knex';
import { ILeadsRecord } from '../../services/interfaces/contact-request.service.interface';

export class LeadsRepository {
  constructor(private readonly db: Knex) {}

  async upsert(contactRequestId: number, data: Omit<ILeadsRecord, 'id' | 'contactRequestId'>): Promise<ILeadsRecord> {
    const existing = await this.db('leads').where({ contact_request_id: contactRequestId }).first();
    if (existing) {
      await this.db('leads').where({ contact_request_id: contactRequestId }).update({
        sfdc_lead_id: data.sfdcLeadId,
        sfdc_contact_id: data.sfdcContactId,
        lead_owner: data.leadOwner,
        updated_at: new Date(),
      });
      return { id: existing.id, contactRequestId, ...data };
    }
    const [id] = await this.db('leads').insert({
      contact_request_id: contactRequestId,
      sfdc_lead_id: data.sfdcLeadId,
      sfdc_contact_id: data.sfdcContactId,
      lead_owner: data.leadOwner,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return { id, contactRequestId, ...data };
  }

  async findByContactRequestId(contactRequestId: number): Promise<ILeadsRecord | null> {
    const row = await this.db('leads').where({ contact_request_id: contactRequestId }).first();
    if (!row) return null;
    return {
      id: row.id,
      contactRequestId: row.contact_request_id,
      sfdcLeadId: row.sfdc_lead_id,
      sfdcContactId: row.sfdc_contact_id,
      leadOwner: row.lead_owner,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findBySfdcLeadId(sfdcLeadId: string): Promise<ILeadsRecord | null> {
    const row = await this.db('leads').where({ sfdc_lead_id: sfdcLeadId }).first();
    if (!row) return null;
    return {
      id: row.id,
      contactRequestId: row.contact_request_id,
      sfdcLeadId: row.sfdc_lead_id,
      sfdcContactId: row.sfdc_contact_id,
      leadOwner: row.lead_owner,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateSfdcIds(
    contactRequestId: number,
    sfdcLeadId: string,
    sfdcContactId?: string,
  ): Promise<void> {
    await this.db('leads').where({ contact_request_id: contactRequestId }).update({
      sfdc_lead_id: sfdcLeadId,
      sfdc_contact_id: sfdcContactId,
      updated_at: new Date(),
    });
  }
}
