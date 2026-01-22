import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import Speciality from './speciality.js'
import { type HasMany, type BelongsTo } from '@adonisjs/lucid/types/relations'
import SubSpecialityTranslation from './sub_speciality_translation.js'

export default class SubSpeciality extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare specialityId: number

  @column()
  declare slug: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /* -----------------------
     RELATIONS
  ------------------------ */

  @belongsTo(() => Speciality)
  declare speciality: BelongsTo<typeof Speciality>

  @hasMany(() => SubSpecialityTranslation)
  declare translations: HasMany<typeof SubSpecialityTranslation>
}
