import { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

export const bazaarifyConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.BAZAARIFY_DB_HOST ?? 'localhost',
    port: parseInt(process.env.BAZAARIFY_DB_PORT ?? '3306', 10),
    user: process.env.BAZAARIFY_DB_USER ?? '',
    password: process.env.BAZAARIFY_DB_PASSWORD ?? '',
    database: process.env.BAZAARIFY_DB_NAME ?? '',
  },
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
  pool: { min: 2, max: 10 },
};

export const growthConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.GROWTH_DB_HOST ?? 'localhost',
    port: parseInt(process.env.GROWTH_DB_PORT ?? '3306', 10),
    user: process.env.GROWTH_DB_USER ?? '',
    password: process.env.GROWTH_DB_PASSWORD ?? '',
    database: process.env.GROWTH_DB_NAME ?? '',
  },
  pool: { min: 2, max: 10 },
};

export default bazaarifyConfig;
