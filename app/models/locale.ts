import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Article from './article.js'
import CategoryTranslation from './categoryTranslation.js'
import TagTranslation from './tagTranslation.js'

export default class Locale extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare language: string

  @column()
  declare country?: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @hasMany(() => Article)
  declare articles: HasMany<typeof Article>

  @hasMany(() => CategoryTranslation)
  declare categoryTranslations: HasMany<typeof CategoryTranslation>

  @hasMany(() => TagTranslation)
  declare tagTranslations: HasMany<typeof TagTranslation>
}
