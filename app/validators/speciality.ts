import vine from '@vinejs/vine'

export const SpecialityValidator = {
  create: vine.compile(
    vine.object({
      specialities: vine.array(
        vine.object({
          id: vine.number().optional(),
          slug: vine.string().trim().minLength(2).maxLength(50),
          subSpecialities: vine.array(
            vine.object({
              id: vine.number().optional(),
              slug: vine.string().trim().minLength(2).maxLength(50),
              translations: vine.array(
                vine.object({
                  id: vine.number().optional(),
                  locale: vine.string(),
                  name: vine.string(),
                })
              ),
            })
          ),
          translations: vine.array(
            vine.object({
              id: vine.number().optional(),
              locale: vine.string(),
              name: vine.string(),
            })
          ),
        })
      ),
    })
  ),
}
