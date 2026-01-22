import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)

      table.string('title').notNullable()
      // Note: Pas de contrainte de clé étrangère car la table users est dans une autre base de données
      table
        .integer('contact_id')
        .unsigned()
        .references('id')
        .inTable('contacts')
        .onDelete('CASCADE')
        .nullable()
      table.uuid('practitioner_id').references('id').inTable('users').notNullable().index()
      table.text('description').nullable()
      table.text('notes').nullable()
      table.boolean('all_day').notNullable().defaultTo(false)
      table.string('color').notNullable()
      table.timestamp('start').nullable()
      table.timestamp('end').nullable()
      table.timestamp('start_recur').nullable()
      table.timestamp('end_recur').nullable()
      table.jsonb('days_of_week').nullable()
      table.string('start_time').nullable()
      table.string('end_time').nullable()
      table.boolean('is_recurring').defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index pour les recherches par patient et praticien
      table.index(['contact_id', 'practitioner_id'])
      table.index('is_recurring')
      table.index('start_recur')
      table.index('end_recur')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
