import vine from '@vinejs/vine'

export const CategoryValidator = {
  create: vine.compile(
    vine.object({
      id: vine.number().optional(),
      translations: vine.array(
        vine.object({
          localeId: vine.number(),
          name: vine.string().trim().minLength(1),
        })
      ),
    })
  ),
  update: vine.compile(
    vine.object({
      translations: vine.array(
        vine.object({
          localeId: vine.number(),
          name: vine.string().trim().minLength(1),
        })
      ),
    })
  ),
}
