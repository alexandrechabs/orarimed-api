import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.uuid('event_id').references('id').inTable('events').notNullable().onDelete('CASCADE')
      table
        .integer('contact_id')
        .references('id')
        .inTable('contacts')
        .nullable()
        .onDelete('CASCADE')
      table
        .enum('type', [
          'appointment_reminder',
          'appointment_cancellation',
          'appointment_confirmation',
          'appointment_reschedule',
          'center_invitation',
        ])
        .notNullable()
      table.enum('channel', ['email', 'sms', 'push']).notNullable()
      table.string('recipient').notNullable() // email or phone number
      table.string('subject').nullable()
      table.text('content').notNullable()
      table.enum('status', ['pending', 'sent', 'delivered', 'failed']).defaultTo('pending')
      table.text('error_message').nullable()
      table.timestamp('sent_at').nullable()
      table.timestamp('delivered_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index pour les recherches
      table.index(['event_id'])
      table.index(['event_id', 'contact_id'])
      table.index('type')
      table.index('status')
      table.index('sent_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
