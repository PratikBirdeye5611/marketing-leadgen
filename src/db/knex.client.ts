import knex, { Knex } from 'knex';
import { env } from '../config/env';

let bazaarifyDb: Knex | null = null;
let growthDb: Knex | null = null;

export function getBazaarifyDB(): Knex {
  if (!bazaarifyDb) {
    bazaarifyDb = knex({
      client: 'mysql2',
      connection: {
        host: env.bazaarifyDb.host,
        port: env.bazaarifyDb.port,
        user: env.bazaarifyDb.user,
        password: env.bazaarifyDb.password,
        database: env.bazaarifyDb.name,
      },
      pool: {
        min: env.bazaarifyDb.pool.min || 2,
        max: env.bazaarifyDb.pool.max || 10,
      },
    });
  }
  return bazaarifyDb;
}

export function getGrowthDB(): Knex {
  if (!growthDb) {
    growthDb = knex({
      client: 'mysql2',
      connection: {
        host: env.growthDb.host,
        port: env.growthDb.port,
        user: env.growthDb.user,
        password: env.growthDb.password,
        database: env.growthDb.name,
      },
      pool: {
        min: env.growthDb.pool.min || 2,
        max: env.growthDb.pool.max || 10,
      },
    });
  }
  return growthDb;
}

export async function closeDB(): Promise<void> {
  if (bazaarifyDb) {
    await bazaarifyDb.destroy();
    bazaarifyDb = null;
  }
  if (growthDb) {
    await growthDb.destroy();
    growthDb = null;
  }
}
