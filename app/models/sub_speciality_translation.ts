import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import SubSpeciality from './sub_speciality.js'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'

export default class SubSpecialityTranslation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare subSpecialityId: number

  @column()
  declare locale: string

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /* -----------------------
     RELATION
  ------------------------ */

  @belongsTo(() => SubSpeciality)
  declare subSpeciality: BelongsTo<typeof SubSpeciality>
}
