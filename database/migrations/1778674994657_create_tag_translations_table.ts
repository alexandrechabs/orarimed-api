import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tag_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('tag_id')
        .unsigned()
        .references('tags.id')
        .onDelete('CASCADE')

      table
        .integer('locale_id')
        .unsigned()
        .references('locales.id')
        .onDelete('CASCADE')

      table.string('name').notNullable()

      table.string('slug').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['tag_id', 'locale_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}