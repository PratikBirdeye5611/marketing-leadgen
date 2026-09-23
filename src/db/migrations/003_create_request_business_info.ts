import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('request_business_info', (table) => {
    table.increments('id').primary();
    table.integer('contact_request_id').unsigned().notNullable();
    table.foreign('contact_request_id').references('id').inTable('contact_requests').onDelete('CASCADE');
    table.string('business_name', 250).nullable();
    table.string('business_phone', 50).nullable();
    table.bigInteger('business_number').nullable();
    table.string('business_locations', 20).nullable();
    table.string('business_employees', 20).nullable();
    table.integer('number_of_employees').nullable();
    table.string('monthly_customers', 10).nullable();
    table.string('industry', 50).nullable();
    table.string('source_industry', 50).nullable();
    table.bigInteger('annual_revenue').unsigned().nullable();
    table.string('monthly_expenditure', 50).nullable();
    table.string('products', 100).nullable();
    table.string('product_of_interest', 100).nullable();
    table.string('locations_under_management', 50).nullable();
    table.string('website', 500).nullable();
    table.string('business_env', 255).nullable();
    table.string('crm_info', 50).nullable();
    table.string('crm_name', 50).nullable();
    table.string('scan_report_url', 100).nullable();
    table.index(['contact_request_id'], 'idx_rbi_contact_request_id');
    table.index(['business_number'], 'idx_rbi_business_number');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('request_business_info');
}
