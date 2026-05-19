import vine from '@vinejs/vine'

const reasonSchema = vine.object({
  id: vine.number().optional(),
  name: vine.string(),
  duration: vine.number(),
  color: vine.string(),
  type: vine.string(),
  active: vine.boolean(),
})

export const ReasonValidator = {
  create: vine.compile(
    vine.object({
      reasons: vine.array(reasonSchema).optional(),
    })
  ),
}
