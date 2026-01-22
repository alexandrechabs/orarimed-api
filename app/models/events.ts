import { DateTime } from 'luxon'
import { BaseModel, beforeSave, belongsTo, column } from '@adonisjs/lucid/orm'
import { Opaque } from '@adonisjs/core/types/helpers'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Contact from './contacts.js'

export type eventId = Opaque<'eventId', string>

export default class Event extends BaseModel {
  // Spécifie la connexion à utiliser (définie dans config/database.ts)

  @column({ isPrimary: true })
  declare id: eventId

  @column()
  declare title: string

  @column()
  declare contactId: number

  @column()
  declare practitionerId: string

  @column()
  declare description: string | null

  @column()
  declare notes: string | null

  @column()
  declare allDay: boolean

  @column()
  declare color: string

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
  public static async setRecurringFlag(event: Event) {
    if (event.startRecur && event.endRecur) {
      event.isRecurring = true
    } else {
      event.isRecurring = false
    }
  }

  @belongsTo(() => Contact, { foreignKey: 'contactId' })
  declare patient: BelongsTo<typeof Contact>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
