import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Diploma extends BaseModel {
  public static table = 'diplomas'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: string

  @column()
  declare title: string

  @column()
  declare institution: string

  @column()
  declare year: number

  @column()
  declare field: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
