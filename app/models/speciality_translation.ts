import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Speciality from './speciality.js'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'

export default class SpecialityTranslation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare specialityId: number

  @column()
  declare locale: string // fr, en, sq...

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /* -----------------------
     RELATION
  ------------------------ */

  @belongsTo(() => Speciality)
  declare speciality: BelongsTo<typeof Speciality>
}
