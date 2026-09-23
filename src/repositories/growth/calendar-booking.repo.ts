import { Knex } from 'knex';
import { ICalendarBooking } from '../../types/calendar.types';

export class CalendarBookingRepository {
  constructor(private readonly db: Knex) {}

  async save(booking: ICalendarBooking): Promise<ICalendarBooking> {
    if (booking.id) {
      await this.db('calendar_booking').where({ id: booking.id }).update(booking);
      return booking;
    }
    const [id] = await this.db('calendar_booking').insert(booking);
    booking.id = id;
    return booking;
  }

  async findById(id: number): Promise<ICalendarBooking | null> {
    const row = await this.db('calendar_booking').where({ id }).first();
    return row ?? null;
  }

  async findByContactRequestId(contactRequestId: number): Promise<ICalendarBooking[]> {
    return this.db('calendar_booking').where({ contact_request_id: contactRequestId });
  }

  async updateRescheduleLink(id: number, rescheduleLink: string): Promise<void> {
    await this.db('calendar_booking')
      .where({ id })
      .update({ reschedule_meeting_url: rescheduleLink });
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.db('calendar_booking').where({ id }).update({ status });
  }
}
