import vine from '@vinejs/vine'

export const CenterValidator = {
  createCenter: vine.compile(
    vine.object({
      name: vine.string(),
      description: vine.string().optional(),
      address: vine.string(),
      city: vine.string(),
      country: vine.string(),
      phoneNumber: vine.string().optional(),
      email: vine.string().optional(),
      website: vine.string().optional(),
      visible: vine.boolean().optional(),
      active: vine.boolean().optional(),
      specialityId: vine.number().optional(),
      coordinate: vine
        .object({
          x: vine.number(),
          y: vine.number(),
        })
        .optional(),
    })
  ),
  updateCenter: vine.compile(
    vine.object({
      id: vine.string(),
      name: vine.string(),
      description: vine.string().optional(),
      address: vine.string(),
      city: vine.string(),
      country: vine.string(),
      phoneNumber: vine.string().optional(),
      email: vine.string().optional(),
      website: vine.string().optional(),
      visible: vine.boolean().optional(),
      active: vine.boolean().optional(),
      specialityId: vine.number().optional(),
      coordinate: vine
        .object({
          x: vine.number(),
          y: vine.number(),
        })
        .optional(),
    })
  ),
  addUsers: vine.compile(
    vine.object({
      doctors: vine.array(
        vine.object({
          doctorId: vine.string(),
          isAdmin: vine.boolean(),
        })
      ),
    })
  ),
}
