import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'

import Article from './article.js'
import TagTranslation from './tagTranslation.js'

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @manyToMany(() => Article, {
    pivotTable: 'article_tags',
  })
  declare articles: ManyToMany<typeof Article>

  @hasMany(() => TagTranslation)
  declare translations: HasMany<typeof TagTranslation>
}