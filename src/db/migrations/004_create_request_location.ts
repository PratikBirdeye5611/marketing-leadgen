import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('request_location', (table) => {
    table.increments('id').primary();
    table.integer('contact_request_id').unsigned().notNullable();
    table.foreign('contact_request_id').references('id').inTable('contact_requests').onDelete('CASCADE');
    table.string('zip', 10).nullable();
    table.string('street', 255).nullable();
    table.string('city', 50).nullable();
    table.string('state', 50).nullable();
    table.string('country', 100).nullable();
    table.string('country_code', 25).nullable();
    table.float('latitude', 23, 20).nullable();
    table.float('longitude', 23, 20).nullable();
    table.string('place_id', 40).nullable();
    table.float('google_rating', 2, 1).nullable();
    table.integer('google_review_count').nullable();
    table.index(['contact_request_id'], 'idx_rl_contact_request_id');
    table.index(['place_id'], 'idx_rl_place_id');
    table.index(['state', 'city'], 'idx_rl_state_city');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('request_location');
}
