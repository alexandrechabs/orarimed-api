import { HttpContext } from '@adonisjs/core/http'
import Experience from '#models/experience'
import User from '#models/user'
import { ExperienceValidator } from '../validators/experience.js'

export default class ExperiencesController {
  async index({ params, auth, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to view experiences' })
    }

    return await Experience.query().where('userId', user.id).orderBy('startYear', 'desc')
  }

  async store({ params, auth, request, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to create an experience' })
    }

    const data = await request.validateUsing(ExperienceValidator.create)
    const experience = await Experience.create({
      userId: user.id,
      company: data.company,
      startYear: data.startYear,
      endYear: data.endYear ?? null,
      description: data.description ?? null,
    })

    return experience
  }

  async update({ params, auth, request, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    const experience = await Experience.find(params.experienceId)
    if (!experience || experience.userId !== user.id) {
      return response.notFound({ error: 'Experience not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to update this experience' })
    }

    const data = await request.validateUsing(ExperienceValidator.update)
    experience.merge(data)
    await experience.save()

    return experience
  }

  async destroy({ params, auth, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    const experience = await Experience.find(params.experienceId)
    if (!experience || experience.userId !== user.id) {
      return response.notFound({ error: 'Experience not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to delete this experience' })
    }

    await experience.delete()
    return response.noContent()
  }
}
