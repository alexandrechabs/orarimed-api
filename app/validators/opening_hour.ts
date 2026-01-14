import vine from '@vinejs/vine'

const openingHourSchema = vine.object({
  dayOfWeek: vine.number().range([0, 6]), // 0 = lundi, 6 = dimanche
  period: vine.enum(['morning', 'afternoon']),
  openTime: vine.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: vine.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  id: vine.number().optional(),
})

export const OpeningHourValidator = {
  create: vine.compile(
    vine.object({
      openingHours: vine.array(openingHourSchema).minLength(1),
    })
  ),
}
