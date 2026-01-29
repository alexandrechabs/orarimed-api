import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sub_specialities_users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('sub_speciality_id')
        .references('id')
        .inTable('sub_specialities')
        .onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.unique(['user_id', 'sub_speciality_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
