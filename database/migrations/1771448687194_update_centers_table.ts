import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'centers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('center_identifier').notNullable()
      table.dropColumn('phone')
      table.string('phone_number')
      table.dropColumn('zip_code')
      table.point('coordinate').nullable()
      table.boolean('visible').notNullable().defaultTo(true)
      table.boolean('active').notNullable().defaultTo(true)
      table.integer('speciality_id').notNullable()
      table.string('avatar').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('center_identifier')
      table.string('phone')
      table.dropColumn('phone_number')
      table.string('zip_code')
      table.dropColumn('coordinate')
      table.dropColumn('visible')
      table.dropColumn('active')
      table.dropColumn('speciality_id')
      table.dropColumn('avatar')
    })
  }
}
