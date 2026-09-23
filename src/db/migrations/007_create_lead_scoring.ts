import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('lead_scoring', (table) => {
    table.increments('id').primary();
    table.integer('contact_request_id').unsigned().notNullable();
    table.foreign('contact_request_id').references('id').inTable('contact_requests').onDelete('CASCADE');
    table.integer('lead_score').nullable();
    table.text('score_color_code').nullable();
    table.string('score_confidence', 5).nullable();
    table.enum('lead_rank', ['A', 'B', 'C', 'D']).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['contact_request_id'], 'idx_ls_contact_request_id');
    table.index(['lead_rank'], 'idx_ls_lead_rank');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('lead_scoring');
}
