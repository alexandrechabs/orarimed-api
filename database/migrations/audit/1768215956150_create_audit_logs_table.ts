import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Type d'action effectuée (ex: 'user.login', 'data.update')
      table.string('action', 100).notNullable()
      table.string('url').notNullable()

      // Utilisateur concerné (peut être null pour les actions non authentifiées)
      table.string('user_id').nullable()

      // Informations sur la requête
      table.string('user_agent', 500).nullable()
      table.string('ip_address', 45).nullable() // IPv6 peut aller jusqu'à 45 caractères

      // Métadonnées supplémentaires (stockées en JSON)
      table.integer('duration')
      table.jsonb('metadata').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      // Index pour les recherches courantes
      table.index(['action'])
      table.index(['user_id'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
