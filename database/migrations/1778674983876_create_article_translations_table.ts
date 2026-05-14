import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'article_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('article_id')
        .unsigned()
        .references('articles.id')
        .onDelete('CASCADE')

      table
        .integer('locale_id')
        .unsigned()
        .references('locales.id')
        .onDelete('CASCADE')

      table.string('title').notNullable()

      table.string('slug').notNullable()

      table.text('excerpt').nullable()

      table.text('content', 'longtext').notNullable()

      table.string('seo_title').nullable()

      table.text('seo_description').nullable()

      table.text('canonical_url').nullable()

      table.integer('reading_time').nullable()

      table.boolean('is_published').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['article_id', 'locale_id'])

      table.unique(['locale_id', 'slug'])

      table.index(['slug'])
      table.index(['locale_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}