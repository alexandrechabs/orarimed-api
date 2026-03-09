import { BaseModel, beforeSave, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Speciality from './speciality.js'
import { type HasMany, type BelongsTo } from '@adonisjs/lucid/types/relations'
import CenterUser from './centers_users.js'
import OpeningHour from './opening_hour.js'

export default class Center extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare address: string

  @column()
  declare city: string

  @column()
  declare country: string

  @column()
  declare phoneNumber: string

  @column()
  declare email: string

  @column()
  declare website: string

  @column()
  declare visible: boolean

  @column()
  declare active: boolean

  @column()
  declare specialityId: number

  @column()
  declare coordinate: any

  @column()
  declare centerIdentifier: string

  @column()
  declare avatar: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeSave()
  public static async createDoctorIdentifier(center: Center) {
    const name = center.name?.toLowerCase().trim() || ''
    const city = center.city?.toLowerCase().trim() || ''
    center.centerIdentifier = `${name}-${city}`.replace(/\s+/g, '-')
  }

  @belongsTo(() => Speciality, {
    foreignKey: 'specialityId',
  })
  declare speciality: BelongsTo<typeof Speciality>

  @hasMany(() => CenterUser)
  declare centerUsers: HasMany<typeof CenterUser>

  @hasMany(() => OpeningHour)
  declare openingHours: HasMany<typeof OpeningHour>
}
