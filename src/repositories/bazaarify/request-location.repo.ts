import { Knex } from 'knex';
import { IRequestLocationRecord } from '../../services/interfaces/contact-request.service.interface';

export class RequestLocationRepository {
  constructor(private readonly db: Knex) {}

  async upsert(contactRequestId: number, data: Omit<IRequestLocationRecord, 'id' | 'contactRequestId'>): Promise<void> {
    const existing = await this.db('request_location').where({ contact_request_id: contactRequestId }).first();
    const row = {
      zip: data.zip,
      street: data.street,
      city: data.city,
      state: data.state,
      country: data.country,
      country_code: data.countryCode,
      latitude: data.latitude,
      longitude: data.longitude,
      place_id: data.placeId,
      google_rating: data.googleRating,
      google_review_count: data.googleReviewCount,
    };

    if (existing) {
      await this.db('request_location').where({ contact_request_id: contactRequestId }).update(row);
    } else {
      await this.db('request_location').insert({ contact_request_id: contactRequestId, ...row });
    }
  }

  async findByContactRequestId(contactRequestId: number): Promise<IRequestLocationRecord | null> {
    const row = await this.db('request_location').where({ contact_request_id: contactRequestId }).first();
    if (!row) return null;
    return {
      id: row.id,
      contactRequestId: row.contact_request_id,
      zip: row.zip,
      street: row.street,
      city: row.city,
      state: row.state,
      country: row.country,
      countryCode: row.country_code,
      latitude: row.latitude,
      longitude: row.longitude,
      placeId: row.place_id,
      googleRating: row.google_rating,
      googleReviewCount: row.google_review_count,
    };
  }

  async updateCountry(
    contactRequestId: number,
    country: string,
    countryCode: string,
  ): Promise<void> {
    await this.db('request_location').where({ contact_request_id: contactRequestId }).update({
      country,
      country_code: countryCode,
    });
  }

  async updateGoogleData(
    contactRequestId: number,
    googleRating: number,
    googleReviewCount: number,
  ): Promise<void> {
    await this.db('request_location').where({ contact_request_id: contactRequestId }).update({
      google_rating: googleRating,
      google_review_count: googleReviewCount,
    });
  }
}
