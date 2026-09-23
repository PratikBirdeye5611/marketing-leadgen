exports.up = async function(knex) {
  await knex.schema.createTable('leads', (table) => {
    table.increments('id').primary();
    table.integer('contact_request_id').unsigned().notNullable();
    table.foreign('contact_request_id').references('id').inTable('contact_requests').onDelete('CASCADE');
    table.string('sfdc_lead_id', 50).nullable();
    table.string('sfdc_contact_id', 40).nullable();
    table.string('lead_owner', 25).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['contact_request_id'], 'idx_leads_contact_request_id');
    table.index(['sfdc_lead_id'], 'idx_leads_sfdc_lead_id');
    table.index(['sfdc_contact_id'], 'idx_leads_sfdc_contact_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('leads');
};
