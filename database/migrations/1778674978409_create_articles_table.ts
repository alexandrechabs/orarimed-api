import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'articles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .text('author')
        .nullable()

      table
        .integer('category_id')
        .unsigned()
        .references('categories.id')
        .nullable()
        .onDelete('SET NULL')

      table.string('status').defaultTo('draft')

      table.text('featured_image').nullable()

      table.timestamp('published_at', { useTz: true }).nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}