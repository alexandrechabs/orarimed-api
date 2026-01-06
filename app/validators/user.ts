import vine from '@vinejs/vine'

export const UserValidator = {
  create: vine.compile(
    vine.object({
      firstname: vine.string().trim().minLength(2).maxLength(50),
      lastname: vine.string().trim().minLength(2).maxLength(50),
      email: vine
        .string()
        .trim()
        .email()
        .unique(async (db, value) => {
          const user = await db.from('users').where('email', value).first()
          return !user
        }),
      password: vine.string().minLength(8).maxLength(32),
    })
  ),

  update: vine.compile(
    vine.object({
      firstname: vine.string().trim().minLength(2).maxLength(50).optional(),
      lastname: vine.string().trim().minLength(2).maxLength(50).optional(),
      genderId: vine.number().optional(),
      roleId: vine.number().optional(),
      address: vine.string().trim().optional(),
      city: vine.string().trim().optional(),
      zipCode: vine.string().trim().optional(),
      country: vine.string().trim().optional(),
      birthDate: vine.date().optional(),
      phoneNumber: vine.string().trim().optional(),
    })
  ),
}
