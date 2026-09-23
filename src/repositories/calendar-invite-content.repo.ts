import { Knex } from 'knex';
import { ICalendarInviteContent } from '../types/calendar.types';

export class CalendarInviteContentRepository {
  
  constructor(private readonly db: Knex) {}
    async findById(id: number): Promise<ICalendarInviteContent | null> {
      const row = await this.db('calendar_invite_content').where({ id }).first();
      return row ?? null;
    }
}