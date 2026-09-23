import { Knex } from 'knex';

export interface IGrowthParameter {
  id?: number;
  name: string;
  value?: string;
  date_added: Date;
  date_modified: Date;
}

export class ParametersRepository {
  constructor(private readonly db: Knex) {}

  async findByName(name: string): Promise<IGrowthParameter | null> {
    const row = await this.db('parameters').where({ name }).first();
    return row ?? null;
  }

  async getValue(name: string): Promise<string | null> {
    const row = await this.findByName(name);
    return row?.value ?? null;
  }

  async getBooleanValue(name: string, defaultValue = false): Promise<boolean> {
    const value = await this.getValue(name);
    if (value === null) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  async getListValue(name: string, defaultValue: string[] = []): Promise<string[]> {
    const value = await this.getValue(name);
    if (!value) return defaultValue;
    return value.split(',').map((v) => v.trim());
  }

  async upsert(name: string, value: string): Promise<void> {
    const existing = await this.findByName(name);
    if (existing) {
      await this.db('parameters').where({ name }).update({ value });
    } else {
      await this.db('parameters').insert({ name, value });
    }
  }
}
