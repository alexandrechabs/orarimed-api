import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import User from './user.js'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Center from './centers.js'

export type PeriodType = 'morning' | 'afternoon'

export default class OpeningHour extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare centerId: string

  @column()
  declare userId: string

  @column()
  declare dayOfWeek: number // 0 (dimanche) à 6 (samedi)

  @column()
  declare period: PeriodType // 'morning' ou 'afternoon'

  @column()
  declare openTime: string // Format 'HH:MM:SS'

  @column()
  declare closeTime: string // Format 'HH:MM:SS'

  @column()
  declare timeZone: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Center, {
    foreignKey: 'centerId',
  })
  declare center: BelongsTo<typeof Center>
}
