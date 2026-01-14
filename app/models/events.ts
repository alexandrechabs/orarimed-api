import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column } from '@adonisjs/lucid/orm'
import { Opaque } from '@adonisjs/core/types/helpers'

export type eventId = Opaque<'eventId', string>

export default class Events extends BaseModel {
  // Spécifie la connexion à utiliser (définie dans config/database.ts)
  static connection = 'secure'

  @column({ isPrimary: true })
  declare id: eventId

  @column()
  declare title: string

  @column()
  declare patientId: string | null

  @column()
  declare practitionerId: string | null

  @column()
  declare description: string | null

  @column()
  declare allDay: boolean

  @column()
  declare backgroundColor: string

  @column()
  declare borderColor: string | null

  @column()
  declare start: DateTime | null

  @column()
  declare end: DateTime | null

  @column()
  declare startRecur: DateTime | null

  @column()
  declare endRecur: DateTime | null

  @column({
    prepare: (value: number[] | null) => {
      if (!value) return null
      try {
        return JSON.stringify(value)
      } catch {
        return null
      }
    },
    consume: (value: any) => {
      if (!value) return null
      try {
        if (Array.isArray(value)) return value
        if (typeof value === 'string') return JSON.parse(value)
        return null
      } catch (error) {
        console.error('Error parsing daysOfWeek:', error)
        return null
      }
    },
  })
  declare daysOfWeek: number[] | null

  @column()
  declare startTime: string | null

  @column()
  declare endTime: string | null

  @column()
  declare isRecurring: boolean

  @beforeSave()
  public static async setRecurringFlag(event: Events) {
    if (event.startRecur && event.endRecur) {
      event.isRecurring = true
    } else {
      event.isRecurring = false
    }
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
