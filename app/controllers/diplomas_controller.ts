import { HttpContext } from '@adonisjs/core/http'
import Diploma from '#models/diploma'
import User from '#models/user'
import { DiplomaValidator } from '../validators/diploma.js'

export default class DiplomasController {
  async index({ params, auth, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to view diplomas' })
    }

    return await Diploma.query().where('userId', user.id)
  }

  async store({ params, auth, request, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to create a diploma' })
    }

    const data = await request.validateUsing(DiplomaValidator.create)
    const diploma = await Diploma.create({
      userId: user.id,
      title: data.title,
      institution: data.institution,
      year: data.year,
      field: data.field ?? null,
    })

    return diploma
  }

  async update({ params, auth, request, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    const diploma = await Diploma.find(params.diplomaId)
    if (!diploma || diploma.userId !== user.id) {
      return response.notFound({ error: 'Diploma not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to update this diploma' })
    }

    const data = await request.validateUsing(DiplomaValidator.update)
    diploma.merge(data)
    await diploma.save()

    return diploma
  }

  async destroy({ params, auth, response }: HttpContext) {
    const authUser = auth.user as User | null
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    const diploma = await Diploma.find(params.diplomaId)
    if (!diploma || diploma.userId !== user.id) {
      return response.notFound({ error: 'Diploma not found' })
    }

    if (authUser?.id !== user.id && authUser?.roleId !== 4) {
      return response.forbidden({ error: 'Not authorized to delete this diploma' })
    }

    await diploma.delete()
    return response.ok({ message: 'Diploma deleted successfully' })
  }
}
