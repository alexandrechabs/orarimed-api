import { BaseModel, column, computed } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export type PeriodType = 'morning' | 'afternoon'

export default class OpeningHour extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare centerId: number

  @column()
  declare userId: string

  @column()
  declare dayOfWeek: number // 0 (dimanche) à 6 (samedi)

  @column()
  declare period: PeriodType // 'morning' ou 'afternoon'

  @column()
  declare openTime: string // Format 'HH:MM:SS'

  @column()
  declare closeTime: string // Format 'HH:MM:SS'

  @computed()
  get formattedOpenTime() {
    return this.openTime ? this.openTime.split(':').slice(0, 2).join(':') : null
  }

  @computed()
  get formattedCloseTime() {
    return this.closeTime ? this.closeTime.split(':').slice(0, 2).join(':') : null
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
