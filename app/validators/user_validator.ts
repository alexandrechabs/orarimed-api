import vine from '@vinejs/vine'

export const registerSchema = vine.compile(
  vine.object({
    email: vine
      .string()
      .trim()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(8).maxLength(32),
    firstname: vine.string().trim().minLength(2).maxLength(50),
    lastname: vine.string().trim().minLength(2).maxLength(50),
    genderId: vine.number().optional(),
  })
)
