import { IBlacklistService } from '../../interfaces/validation/blacklist.service.interface';
import { Knex } from 'knex';

export class BlacklistService implements IBlacklistService {
  constructor(private readonly db: Knex) {}

  async isBlacklisted(address: string, isDomain: boolean): Promise<boolean> {
    if (!address) return false;
    const result = await this.db('lead_blacklist')
      .where({ lead_address: address.toLowerCase(), domain: isDomain ? 1 : 0 })
      .first();
    return !!result;
  }
}
