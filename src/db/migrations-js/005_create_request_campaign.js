exports.up = async function(knex) {
  await knex.schema.createTable('request_campaign', (table) => {
    table.increments('id').primary();
    table.integer('contact_request_id').unsigned().notNullable();
    table.foreign('contact_request_id').references('id').inTable('contact_requests').onDelete('CASCADE');
    table.string('lead_campaign', 250).nullable();
    table.string('lead_sub_campaign', 250).nullable();
    table.string('lead_campaign_kw', 255).nullable();
    table.string('lead_content', 255).nullable();
    table.string('lead_medium', 255).nullable();
    table.string('lead_source', 20).nullable();
    table.string('lead_sfdc_campaign', 50).nullable();
    table.string('intent', 100).nullable();
    table.string('buying_intent', 50).nullable();
    table.index(['contact_request_id'], 'idx_rca_contact_request_id');
    table.index(['lead_campaign', 'lead_source'], 'idx_rca_campaign_source');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('request_campaign');
};
