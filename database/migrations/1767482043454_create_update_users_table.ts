import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UpdateUsersTable extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('full_name')

      table.string('firstname').notNullable()
      table.string('lastname').notNullable()
      table.integer('gender_id').notNullable()
      table.integer('role_id').notNullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('firstname')
      table.dropColumn('lastname')
      table.string('full_name')
      table.dropColumn('gender_id')
      table.dropColumn('role_id')
    })
  }
}
