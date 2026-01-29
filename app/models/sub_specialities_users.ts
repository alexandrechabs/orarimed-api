import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import SubSpeciality from './sub_speciality.js'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'

export default class SubSpecialitiesUsers extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare subSpecialityId: number

  @column()
  declare userId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => SubSpeciality)
  declare subSpeciality: BelongsTo<typeof SubSpeciality>
}
