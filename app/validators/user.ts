import vine from '@vinejs/vine'

export const UserValidator = {
  create: vine.compile(
    vine.object({
      firstname: vine.string().trim().minLength(2).maxLength(50),
      lastname: vine.string().trim().minLength(2).maxLength(50),
      phoneNumber: vine.string().trim().minLength(10).maxLength(15).optional(),
      email: vine
        .string()
        .trim()
        .email()
        .unique(async (db, value) => {
          const user = await db.from('users').where('email', value).first()
          return !user
        }),
      password: vine.string().minLength(8).maxLength(32),
      roleId: vine.number(),
      acceptTerms: vine.boolean(),
      specialityId: vine.number().optional(),
      address: vine.string().trim().optional(),
      city: vine.string().trim().optional(),
      country: vine.string().trim().optional(),
      coordinate: vine
        .object({
          x: vine.number(),
          y: vine.number(),
        })
        .optional(),
      language: vine.string().trim(),
    })
  ),

  update: vine.compile(
    vine.object({
      firstname: vine.string().trim().minLength(2).maxLength(50).optional(),
      lastname: vine.string().trim().minLength(2).maxLength(50).optional(),
      genderId: vine.number().optional(),
      avatar: vine.string().trim().optional(),
      roleId: vine.number().optional(),
      address: vine.string().trim().optional(),
      city: vine.string().trim().optional(),
      country: vine.string().trim().optional(),
      birthDate: vine.date().optional(),
      phoneNumber: vine.string().trim().optional(),
      specialityId: vine.number().optional(),
      visible: vine.boolean().optional(),
      active: vine.boolean().optional(),
      coordinate: vine
        .object({
          x: vine.number(),
          y: vine.number(),
        })
        .optional(),
      language: vine.string().trim(),
    })
  ),
  search: vine.compile(
    vine.object({
      search: vine.string().trim().minLength(2).maxLength(50),
    })
  ),
  searchDoctorAutoComplete: vine.compile(
    vine.object({
      q: vine.string().trim().minLength(2).maxLength(50),
      locale: vine.string().trim().minLength(2).maxLength(2),
    })
  ),
  searchDoctor: vine.compile(
    vine.object({
      address: vine.any().transform((value: string | string[]) => {
        return Array.isArray(value) ? value.join(',') : value
      }),
      lat: vine.string().transform(Number),
      lng: vine.string().transform(Number),
      locale: vine.string().trim(),
      q: vine.string().trim(),
    })
  ),
}
