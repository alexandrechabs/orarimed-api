import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'speciality_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('speciality_id')
        .unsigned()
        .references('id')
        .inTable('specialities')
        .onDelete('CASCADE')

      table.string('locale', 5).notNullable() // fr, en, sq…
      table.string('name').notNullable()

      table.unique(['speciality_id', 'locale'])
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
