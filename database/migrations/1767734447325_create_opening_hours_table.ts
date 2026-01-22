import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'opening_hours'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .uuid('center_id')
        .unsigned()
        .references('id')
        .inTable('centers')
        .onDelete('CASCADE')
        .nullable()
      table
        .uuid('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .nullable()
      table.integer('day_of_week').notNullable()
      table.enum('period', ['morning', 'afternoon']).notNullable()
      table.string('open_time').notNullable()
      table.string('close_time').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
