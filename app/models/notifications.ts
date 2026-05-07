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
    | 'mail_appointment_reminder'
    | 'mail_appointment_cancellation'
    | 'mail_appointment_cancellation_doctor'
    | 'mail_appointment_confirmation'
    | 'mail_appointment_reschedule'
    | 'mail_center_invitation'
    | 'mail_create_account'
    | 'mail_create_account_doctor'
    | 'mail_create_account_secretary'
    | 'mail_password_reset'
    | 'mail_email_verification'
    | 'mail_contact_form'

  @column()
  declare channel: 'email' | 'sms' | 'push'

  @column()
  declare recipient: string

  @column()
  declare subject: string | null

  @column()
  declare content: string

  @column()
  declare status: 'pending' | 'sent' | 'delivered' | 'failed' | 'processing'

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
