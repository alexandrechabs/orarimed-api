import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'

import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

import Category from './category.js'
import Locale from './locale.js'
import Tag from './tag.js'

export default class Article extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare author?: string

  @column()
  declare categoryId?: number

  @column()
  declare status: string

  @column()
  declare featuredImage?: string

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

  @column.dateTime()
  declare publishedAt?: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // relations

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => Locale)
  declare locale: BelongsTo<typeof Locale>

  @manyToMany(() => Tag, {
    pivotTable: 'article_tags',
  })
  declare tags: ManyToMany<typeof Tag>
}
