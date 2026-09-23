import { Knex } from 'knex';
import { ILeadScoringRecord } from '../../services/interfaces/contact-request.service.interface';

export class LeadScoringRepository {
  constructor(private readonly db: Knex) {}

  async upsert(contactRequestId: number, data: Omit<ILeadScoringRecord, 'id' | 'contactRequestId'>): Promise<ILeadScoringRecord> {
    const existing = await this.db('lead_scoring').where({ contact_request_id: contactRequestId }).first();
    if (existing) {
      await this.db('lead_scoring').where({ contact_request_id: contactRequestId }).update({
        lead_score: data.leadScore,
        score_color_code: data.scoreColorCode,
        score_confidence: data.scoreConfidence,
        lead_rank: data.leadRank,
        updated_at: new Date(),
      });
      return { id: existing.id, contactRequestId, ...data };
    }
    const [id] = await this.db('lead_scoring').insert({
      contact_request_id: contactRequestId,
      lead_score: data.leadScore,
      score_color_code: data.scoreColorCode,
      score_confidence: data.scoreConfidence,
      lead_rank: data.leadRank,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return { id, contactRequestId, ...data };
  }

  async findByContactRequestId(contactRequestId: number): Promise<ILeadScoringRecord | null> {
    const row = await this.db('lead_scoring').where({ contact_request_id: contactRequestId }).first();
    if (!row) return null;
    return {
      id: row.id,
      contactRequestId: row.contact_request_id,
      leadScore: row.lead_score,
      scoreColorCode: row.score_color_code,
      scoreConfidence: row.score_confidence,
      leadRank: row.lead_rank,
    };
  }
}
