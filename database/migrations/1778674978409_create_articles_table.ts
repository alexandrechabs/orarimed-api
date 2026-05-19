import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'articles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('author').nullable()

      table
        .integer('category_id')
        .unsigned()
        .references('categories.id')
        .nullable()
        .onDelete('SET NULL')

      table.string('status').defaultTo('draft')

      table.text('featured_image').nullable()

      table.integer('locale_id').unsigned().references('locales.id').onDelete('CASCADE')

      table.string('title').notNullable()

      table.string('slug').notNullable()

      table.text('excerpt').nullable()

      table.text('content', 'longtext').notNullable()

      table.string('seo_title').nullable()

      table.text('seo_description').nullable()

      table.text('canonical_url').nullable()

      table.integer('reading_time').nullable()

      table.timestamp('published_at', { useTz: true }).nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['locale_id', 'slug'])

      table.index(['slug'])
      table.index(['locale_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
