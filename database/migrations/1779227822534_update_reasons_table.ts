import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reasons'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('active')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('active')
    })
  }
}
