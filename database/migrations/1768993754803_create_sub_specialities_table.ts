import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sub_specialities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('speciality_id')
        .unsigned()
        .references('id')
        .inTable('specialities')
        .onDelete('CASCADE')

      table.string('slug').notNullable()
      table.timestamps(true)

      table.unique(['speciality_id', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
