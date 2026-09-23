import { Knex } from 'knex';

export class BlacklistRepository {
  constructor(private readonly db: Knex) {}

  async existsByLeadAddressAndDomain(address: string, isDomain: boolean): Promise<boolean> {
    const row = await this.db('lead_blacklist')
      .where({ lead_address: address.toLowerCase(), domain: isDomain ? 1 : 0 })
      .first();
    return !!row;
  }

  async addToBlacklist(address: string, isDomain: boolean): Promise<void> {
    await this.db('lead_blacklist').insert({
      lead_address: address.toLowerCase(),
      domain: isDomain ? 1 : 0,
      created_at: new Date(),
    });
  }

  async removeFromBlacklist(address: string, isDomain: boolean): Promise<void> {
    await this.db('lead_blacklist')
      .where({ lead_address: address.toLowerCase(), domain: isDomain ? 1 : 0 })
      .delete();
  }
}
