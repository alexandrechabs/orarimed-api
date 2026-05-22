import vine from '@vinejs/vine'

export const DiplomaValidator = {
  create: vine.compile(
    vine.object({
      title: vine.string().trim().minLength(2).maxLength(255),
      institution: vine.string().trim().minLength(2).maxLength(255),
      year: vine.number().min(1900).max(new Date().getFullYear()),
      field: vine.string().trim().minLength(2).maxLength(100).optional(),
    })
  ),

  update: vine.compile(
    vine.object({
      title: vine.string().trim().minLength(2).maxLength(255).optional(),
      institution: vine.string().trim().minLength(2).maxLength(255).optional(),
      year: vine.number().min(1900).max(new Date().getFullYear()).optional(),
      field: vine.string().trim().minLength(2).maxLength(100).optional(),
    })
  ),
}
