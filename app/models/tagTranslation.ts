import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Locale from './Locale.js'
import Tag from './tag.js'

export default class TagTranslation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tagId: number

  @column()
  declare localeId: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @belongsTo(() => Tag)
  declare tag: BelongsTo<typeof Tag>

  @belongsTo(() => Locale)
  declare locale: BelongsTo<typeof Locale>
}