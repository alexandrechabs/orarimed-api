import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Category from './category.js'
import Locale from './locale.js'

export default class CategoryTranslation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare categoryId: number

  @column()
  declare localeId: number

  @column()
  declare name: string

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => Locale)
  declare locale: BelongsTo<typeof Locale>
}
