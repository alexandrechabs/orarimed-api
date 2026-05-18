import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'locales'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('code', 10).notNullable().unique()
      table.string('language').notNullable()
      table.string('country').nullable()

      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  // add locales
  async seed() {
  const locales = [
    { code: 'fr', language: 'Francais', country: 'FR' },
    { code: 'en', language: 'English', country: 'US' },
    { code: 'sq', language: 'Shqip', country: 'AL' },
  ]

  for (const locale of locales) {
    await this.db.table('locales').insert(locale)
  }
}

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
