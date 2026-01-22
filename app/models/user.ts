import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { Opaque } from '@adonisjs/core/types/helpers'

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
  declare country: string

  @column()
  declare coordinate: any

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '180 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })
}
