import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Center from './centers.js'
import User from './user.js'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class CenterUser extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare centerId: string

  @column()
  declare userId: string

  @column()
  declare isAdmin: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Center, {
    foreignKey: 'centerId',
  })
  declare center: BelongsTo<typeof Center>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
