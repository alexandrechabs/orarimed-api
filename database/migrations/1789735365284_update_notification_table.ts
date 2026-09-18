import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('mail_id').nullable()
    })
    this.schema.raw(`
      ALTER TABLE notifications
      DROP CONSTRAINT IF EXISTS notifications_status_check;

      ALTER TABLE notifications
      ADD CONSTRAINT notifications_status_check
      CHECK (
        status IN (
          'pending',
          'blocked',
          'invalid_email',
          'sent',
          'opened',
          'unique_opened',
          'spam',
          'delivered',
          'failed'
        )
      );
    `)
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('mail_id')
      this.schema.raw(`
      ALTER TABLE notifications
      DROP CONSTRAINT IF EXISTS notifications_status_check;

      ALTER TABLE notifications
      ADD CONSTRAINT notifications_status_check
      CHECK (
        status IN (
          'pending',
          'sent',
          'delivered',
          'failed'
        )
      );
    `)
    })
  }
}
