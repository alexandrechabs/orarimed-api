import vine from '@vinejs/vine'

export const ExperienceValidator = {
  create: vine.compile(
    vine.object({
      company: vine.string().trim().minLength(2).maxLength(255),
      startYear: vine.number().min(1900).max(new Date().getFullYear()),
      endYear: vine.number().min(1900).max(new Date().getFullYear()).optional(),
      description: vine.string().trim().minLength(5).maxLength(1000).optional(),
    })
  ),

  update: vine.compile(
    vine.object({
      company: vine.string().trim().minLength(2).maxLength(255).optional(),
      startYear: vine.number().min(1900).max(new Date().getFullYear()).optional(),
      endYear: vine.number().min(1900).max(new Date().getFullYear()).optional(),
      description: vine.string().trim().minLength(5).maxLength(1000).optional(),
    })
  ),
}
