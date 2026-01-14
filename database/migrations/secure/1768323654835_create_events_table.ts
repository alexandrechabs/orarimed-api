import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)

      table.string('title').notNullable()
      // Note: Pas de contrainte de clé étrangère car la table users est dans une autre base de données
      table.uuid('patient_id').nullable().index()
      table.uuid('practitioner_id').nullable().index()
      table.text('description').nullable()
      table.text('notes').nullable()
      table.boolean('all_day').notNullable().defaultTo(false)
      table.string('background_color').notNullable()
      table.string('border_color').nullable()
      table.timestamp('start').nullable()
      table.timestamp('end').nullable()
      table.timestamp('start_recur').nullable()
      table.timestamp('end_recur').nullable()
      table.jsonb('days_of_week').nullable()
      table.string('start_time').nullable()
      table.string('end_time').nullable()
      table.boolean('is_recurring').defaultTo(false)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Index pour les recherches par patient et praticien
      table.index(['patient_id', 'practitioner_id'])
      table.index('is_recurring')
      table.index('start_recur')
      table.index('end_recur')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
