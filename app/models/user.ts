import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeSave, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { Opaque } from '@adonisjs/core/types/helpers'
import SubSpecialitiesUsers from './sub_specialities_users.js'
import { type HasMany, type BelongsTo, type ManyToMany } from '@adonisjs/lucid/types/relations'
import Speciality from './speciality.js'
import SubSpeciality from './sub_speciality.js'
import OpeningHour from './opening_hour.js'
import CenterUser from './centers_users.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})
export type userId = Opaque<'userId', string>

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: userId

  @column()
  declare firstname: string

  @column()
  declare lastname: string

  @column()
  declare email: string

  @column()
  declare roleId: number

  @column()
  declare genderId: number

  @column()
  declare active: boolean

  @column()
  declare visible: boolean

  @column()
  declare emailVerified: boolean

  @column()
  declare emailVerificationToken: string | null

  @column.dateTime()
  declare emailVerificationExpires: DateTime | null

  @column()
  declare acceptTerms: boolean

  @column()
  declare bio: string

  @column()
  declare avatar: string

  @column()
  declare birthDate: Date

  @column()
  declare phoneNumber: string

  @column()
  declare address: string

  @column()
  declare city: string

  @column()
  declare doctorIdentifier: string | null

  @column()
  declare country: string

  @column()
  declare coordinate: any

  @column()
  declare specialityId: number | null

  @column()
  declare language: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeSave()
  public static async createDoctorIdentifier(user: User) {
    if (user.roleId === 2) {
      // 2 est l'ID pour le rôle docteur
      const firstname = user.firstname?.toLowerCase().trim() || ''
      const lastname = user.lastname?.toLowerCase().trim() || ''
      const city = user.city?.toLowerCase().trim() || ''
      user.doctorIdentifier = `${firstname}-${lastname}-${city}`.replace(/\s+/g, '-')
    } else {
      user.doctorIdentifier = null
    }
  }

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '180 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

  @hasMany(() => SubSpecialitiesUsers)
  declare subSpecialitiesUsers: HasMany<typeof SubSpecialitiesUsers>

  @manyToMany(() => SubSpeciality, {
    pivotTable: 'sub_specialities_users',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'sub_speciality_id',
  })
  declare subSpecialities: ManyToMany<typeof SubSpeciality>

  @belongsTo(() => Speciality, {
    foreignKey: 'specialityId',
  })
  declare speciality: BelongsTo<typeof Speciality>

  @hasMany(() => OpeningHour)
  declare openingHours: HasMany<typeof OpeningHour>

  @hasMany(() => CenterUser)
  declare centerUsers: HasMany<typeof CenterUser>
}
