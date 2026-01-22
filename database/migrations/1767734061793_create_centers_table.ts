import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'centers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('name').notNullable()
      table.string('description').notNullable()
      table.string('address').notNullable()
      table.string('city').notNullable()
      table.string('zip_code').notNullable()
      table.string('country').notNullable()
      table.string('phone').notNullable()
      table.string('email').notNullable()
      table.string('website').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
