import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('speciality_id')
        .unsigned()
        .references('id')
        .inTable('specialities')
        .onDelete('SET NULL')
      table.string('doctor_identifier').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('speciality_id')
    })
  }
}
