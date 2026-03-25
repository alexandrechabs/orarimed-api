import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class SecretaryUser extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare secretaryId: string

  @column()
  declare doctorId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare secretary: BelongsTo<typeof User>

  @belongsTo(() => User)
  declare doctor: BelongsTo<typeof User>
}
