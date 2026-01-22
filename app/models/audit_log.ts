import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AuditLog extends BaseModel {
  // Spécifie la connexion à utiliser (définie dans config/database.ts)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare action: string

  @column()
  declare url: string

  @column()
  declare userId: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare ipAddress: string | null

  @column()
  declare duration: number

  @column()
  declare metadata: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Exemple de méthode utilitaire
  static async logAction(
    action: string,
    userId: string | null,
    request: any,
    metadata: any = {},
    duration: number
  ) {
    return await this.create({
      action,
      userId,
      userAgent: request?.header('user-agent') || null,
      ipAddress: request?.ip() || null,
      duration: duration,
      metadata: JSON.stringify(metadata),
    })
  }
}
