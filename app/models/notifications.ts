import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Event from './events.js'
import User from './user.js'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eventId: string

  @column()
  declare contactId: number | null

  @column()
  declare type:
    | 'appointment_reminder'
    | 'appointment_cancellation'
    | 'appointment_confirmation'
    | 'appointment_reschedule'
    | 'center_invitation'

  @column()
  declare channel: 'email' | 'sms' | 'push'

  @column()
  declare recipient: string

  @column()
  declare subject: string | null

  @column()
  declare content: string

  @column()
  declare status: 'pending' | 'sent' | 'delivered' | 'failed'

  @column()
  declare errorMessage: string | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @belongsTo(() => Event, { foreignKey: 'eventId' })
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
