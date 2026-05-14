import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'

import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import Category from './category.js'
import ArticleTranslation from './articleTranslation.js'
import Tag from './tag.js'

export default class Article extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare author: string

  @column()
  declare categoryId?: number

  @column()
  declare status: string

  @column()
  declare featuredImage?: string

  @column.dateTime()
  declare publishedAt?: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // relations

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @hasMany(() => ArticleTranslation)
  declare translations: HasMany<typeof ArticleTranslation>

  @manyToMany(() => Tag, {
    pivotTable: 'article_tags',
  })
  declare tags: ManyToMany<typeof Tag>
}