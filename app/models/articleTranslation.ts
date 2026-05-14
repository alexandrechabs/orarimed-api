import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Article from './article.js'
import Locale from './locale.js'

export default class ArticleTranslation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare articleId: number

  @column()
  declare localeId: number

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare excerpt?: string

  @column()
  declare content: string

  @column()
  declare seoTitle?: string

  @column()
  declare seoDescription?: string

  @column()
  declare canonicalUrl?: string

  @column()
  declare readingTime?: number

  @column()
  declare isPublished: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // relations

  @belongsTo(() => Article)
  declare article: BelongsTo<typeof Article>

  @belongsTo(() => Locale)
  declare locale: BelongsTo<typeof Locale>
}
