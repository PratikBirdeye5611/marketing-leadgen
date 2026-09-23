import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('request_contacts', (table) => {
    table.increments('id').primary();
    table.integer('contact_request_id').unsigned().notNullable();
    table.foreign('contact_request_id').references('id').inTable('contact_requests').onDelete('CASCADE');
    table.string('first_name', 40).nullable();
    table.string('last_name', 80).nullable();
    table.string('email_id', 80).nullable();
    table.string('phone', 30).nullable();
    table.string('mobile_phone', 30).nullable();
    table.index(['contact_request_id'], 'idx_rc_contact_request_id');
    table.index(['email_id'], 'idx_rc_email_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('request_contacts');
}
