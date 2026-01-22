import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sub_speciality_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('sub_speciality_id')
        .unsigned()
        .references('id')
        .inTable('sub_specialities')
        .onDelete('CASCADE')

      table.string('locale', 5).notNullable()
      table.string('name').notNullable()

      table.unique(['sub_speciality_id', 'locale'])
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
