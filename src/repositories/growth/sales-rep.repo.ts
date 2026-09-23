import { Knex } from 'knex';
import { ISalesRepresentative, IBookingSalesRep } from '../../types/calendar.types';

export class SalesRepRepository {
  constructor(private readonly db: Knex) {}

  async findByActiveAndPageUrlType(
    active: boolean,
    pageUrlType: string,
  ): Promise<ISalesRepresentative[]> {
    return this.db('sales_representative as sr')
      .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
      .join('page_url as p', 'p.id', 'm.page_url_id')
      .where({ 'sr.active': active, 'p.type': pageUrlType })
      .select('sr.*');
  }

  async findByActiveAndPageUrlSlug(
    active: boolean,
    slug: string,
  ): Promise<ISalesRepresentative[]> {
    return this.db('sales_representative as sr')
      .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
      .join('page_url as p', 'p.id', 'm.page_url_id')
      .where({ 'sr.active': active, 'p.slug': slug })
      .select('sr.*');
  }

  async findByActiveAndPageUrlSlugAndSfdcRoleIn(
    active: boolean,
    slug: string,
    sfdcRoles: string[],
  ): Promise<ISalesRepresentative[]> {
    return this.db('sales_representative as sr')
      .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
      .join('page_url as p', 'p.id', 'm.page_url_id')
      .where({ 'sr.active': active, 'p.slug': slug })
      .whereIn('sr.sfdc_role', sfdcRoles)
      .select('sr.*');
  }

  async findByActiveAndPageUrlTypeAndSfdcRoleIn(
    active: boolean,
    pageUrlType: string,
    sfdcRoles: string[],
  ): Promise<ISalesRepresentative[]> {
    return this.db('sales_representative as sr')
      .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
      .join('page_url as p', 'p.id', 'm.page_url_id')
      .where({ 'sr.active': active, 'p.type': pageUrlType })
      .whereIn('sr.sfdc_role', sfdcRoles)
      .select('sr.*');
  }

  async findBySfdcIdAndActiveTrue(sfdcId: string): Promise<string | null> {
    const row = await this.db('sales_representative')
      .where({ sfdc_id: sfdcId, active: true })
      .select('email_id')
      .first();
    return row?.email_id ?? null;
  }

  async findNameByEmailId(emailId: string): Promise<string | null> {
    const row = await this.db('sales_representative')
      .where({ email_id: emailId })
      .select('name')
      .first();
    return row?.name ?? null;
  }

  async getSalesRepForCalendarBooking(emailId: string): Promise<IBookingSalesRep | null> {
    const row = await this.db('sales_representative as sr')
      .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
      .where({ 'sr.email_id': emailId })
      .select('sr.id as salesRepresentativesId', 'sr.email_id as emailId', 'sr.name', 'sr.sfdc_id as sfdcId', 'm.page_url_id as pageUrlId')
      .first();
    return row ?? null;
  }

  async getHighPrioritySalesRepForCalendarBookingBySlug(
    slug: string,
    emailIds: string[],
  ): Promise<IBookingSalesRep | null> {
    const row = await this.db('sales_representative as sr')
      .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
      .join('page_url as p', 'p.id', 'm.page_url_id')
      .where({ 'p.slug': slug, 'sr.active': true })
      .whereIn('sr.email_id', emailIds)
      .orderBy('m.last_booking_time', 'asc')
      .select('sr.id as salesRepresentativesId', 'sr.email_id as emailId', 'sr.name', 'sr.sfdc_id as sfdcId', 'm.page_url_id as pageUrlId')
      .first();
    return row ?? null;
  }

  async getHighPrioritySalesRepForCalendarBookingByType(
    pageUrlType: string,
    emailIds: string[],
  ): Promise<IBookingSalesRep | null> {
    const row = await this.db('sales_representative as sr')
      .join('sales_rep_page_url_mapping as m', 'm.sales_representatives_id', 'sr.id')
      .join('page_url as p', 'p.id', 'm.page_url_id')
      .where({ 'p.type': pageUrlType, 'sr.active': true })
      .whereIn('sr.email_id', emailIds)
      .orderBy('m.last_booking_time', 'asc')
      .select('sr.id as salesRepresentativesId', 'sr.email_id as emailId', 'sr.name', 'sr.sfdc_id as sfdcId', 'm.page_url_id as pageUrlId')
      .first();
    return row ?? null;
  }

  async updateLastBookingTime(salesRepId: number, pageUrlId: number, time: Date): Promise<void> {
    await this.db('sales_rep_page_url_mapping')
      .where({ sales_representatives_id: salesRepId, page_url_id: pageUrlId })
      .update({ last_booking_time: time });
  }
}
