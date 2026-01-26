import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import SpecialityTranslation from './speciality_translation.js'
import SubSpeciality from './sub_speciality.js'
import { type HasMany } from '@adonisjs/lucid/types/relations'

export default class Speciality extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare icon: string | null

  @column()
  declare color: string | null

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => SpecialityTranslation)
  declare translations: HasMany<typeof SpecialityTranslation>

  @hasMany(() => SubSpeciality)
  declare subSpecialities: HasMany<typeof SubSpeciality>
}
