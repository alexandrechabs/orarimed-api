import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Contact extends BaseModel {
  // Spécifie la connexion à utiliser (définie dans config/database.ts)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare patientId: string | null

  @column()
  declare practitionerId: string

  @column()
  declare firstname: string

  @column()
  declare lastname: string

  @column()
  declare email: string | null

  @column()
  declare phoneNumber: string

  @column()
  declare birthDate: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
