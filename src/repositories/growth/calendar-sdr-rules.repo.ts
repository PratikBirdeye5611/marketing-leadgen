import { Knex } from 'knex';
import { ICalendarSdrRules } from '../../types/calendar.types';

export class CalendarSdrRulesRepository {
  constructor(private readonly db: Knex) {}

  async findBySegmentAndCountry(
    segment: string,
    countryCode: string,
  ): Promise<ICalendarSdrRules | null> {
    const row = await this.db('calendar_sdr_rules')
      .where({ segment, country: countryCode })
      .first();
    return row ?? null;
  }

  async findByCountry(countryCode: string): Promise<ICalendarSdrRules | null> {
    const row = await this.db('calendar_sdr_rules')
      .where({ country: countryCode })
      .whereNull('segment')
      .first();
    return row ?? null;
  }

  async findBySegment(segment: string): Promise<ICalendarSdrRules | null> {
    const row = await this.db('calendar_sdr_rules').where({ segment }).first();
    return row ?? null;
  }

  async findSDRRules(
    businessLocation: string,
    industry: string,
  ): Promise<ICalendarSdrRules | null> {
    const query = this.db('calendar_sdr_rules').where(function () {
      if (businessLocation) this.where({ business_location: businessLocation });
      if (industry) this.where({ industry });
    });
    const row = await query.first();
    return row ?? null;
  }
}
