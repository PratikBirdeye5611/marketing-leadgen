import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('contact_requests', (table) => {
    table.increments('id').primary();
    table.enum('request_type', ['contact', 'demo', 'scan']).notNullable().defaultTo('contact');
    table.enum('form_fill_type', ['MANUAL', 'COOKIE', 'URL']).defaultTo('MANUAL');
    table.string('visit_id', 50).nullable();
    table.string('session_id', 50).nullable();
    table.string('form_fill_id', 40).nullable();
    table.string('remote_ip_address', 50).nullable();
    table.string('device_name', 20).nullable();
    table.string('be_cta', 300).nullable();
    table.text('experiment_names').nullable();
    table.string('ad_click_id', 255).nullable();
    table.string('click_page_type', 100).nullable();
    table.string('lead_page_type', 100).nullable();
    table.text('click_url').nullable();
    table.text('lead_url').nullable();
    table.text('comments').nullable();
    table.string('profile_url', 100).nullable();
    table.text('error_message').nullable();
    table.string('existing_lead_status', 30).nullable();
    table.tinyint('lead_created').notNullable().defaultTo(0);
    table.boolean('skip_lead').defaultTo(false);
    table.tinyint('from_google').defaultTo(0);
    table.tinyint('aggregation_completed').defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['lead_created'], 'idx_lead_created');
    table.index(['from_google'], 'idx_from_google');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('contact_requests');
}
