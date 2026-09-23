import { Knex } from 'knex';
import { IPageUrl, IPageUrlCalendarBookingTemplateView } from '../../types/calendar.types';

export class PageUrlRepository {
  constructor(private readonly db: Knex) {}

  async findByType(type: string): Promise<IPageUrl | null> {
    const row = await this.db('page_url').where({ type }).first();
    return row ?? null;
  }

  async findBySlug(slug: string): Promise<IPageUrl | null> {
    const row = await this.db('page_url').where({ slug }).first();
    return row ?? null;
  }

  async findCalendarBookingTemplateByType(
    type: string,
  ): Promise<IPageUrlCalendarBookingTemplateView | null> {
    const row = await this.db('page_url')
      .where({ type })
      .select('id', 'type', 'slug', 'request_type', 'meeting_description', 'active', 'fallback_calendar')
      .first();
    return row ?? null;
  }

  async findCalendarBookingTemplateBySlug(
    slug: string,
  ): Promise<IPageUrlCalendarBookingTemplateView | null> {
    const row = await this.db('page_url')
      .where({ slug })
      .select('id', 'type', 'slug', 'request_type', 'meeting_description', 'active', 'fallback_calendar')
      .first();
    return row ?? null;
  }

  async isSegmentAssignmentEnabledByType(type: string): Promise<boolean> {
    const row = await this.db('page_url')
      .where({ type })
      .select('segment_assignment_enabled')
      .first();
    return !!row?.segment_assignment_enabled;
  }

  async isSegmentAssignmentEnabledBySlug(slug: string): Promise<boolean> {
    const row = await this.db('page_url')
      .where({ slug })
      .select('segment_assignment_enabled')
      .first();
    return !!row?.segment_assignment_enabled;
  }

  async findDistributionTypeBySlug(slug: string): Promise<string | null> {
    const row = await this.db('page_url').where({ slug }).select('distribution_type').first();
    return row?.distribution_type ?? null;
  }

  async findDistributionTypeByType(type: string): Promise<string | null> {
    const row = await this.db('page_url').where({ type }).select('distribution_type').first();
    return row?.distribution_type ?? null;
  }
}
