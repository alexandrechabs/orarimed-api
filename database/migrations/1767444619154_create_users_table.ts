import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('firstname').notNullable()
      table.string('lastname').notNullable()
      table.integer('gender_id').nullable()
      table.integer('role_id').notNullable()
      table.string('avatar').nullable()
      table.date('birth_date').nullable()
      table.string('bio').nullable()
      table.string('address').nullable()
      table.string('city').nullable()
      table.string('zip_code').nullable()
      table.string('country').nullable()
      table.string('phone').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
