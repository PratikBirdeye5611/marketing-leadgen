require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

module.exports = {
  client: 'mysql2',
  connection: {
    host: process.env.BAZAARIFY_DB_HOST,
    port: parseInt(process.env.BAZAARIFY_DB_PORT || '3306', 10),
    user: process.env.BAZAARIFY_DB_USER,
    password: process.env.BAZAARIFY_DB_PASSWORD,
    database: process.env.BAZAARIFY_DB_NAME,
  },
  migrations: {
    directory: './src/db/migrations-js',
  },
  pool: { min: 2, max: 10 },
};
