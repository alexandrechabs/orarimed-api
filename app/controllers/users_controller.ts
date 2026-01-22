import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import OpeningHour from '#models/opening_hour'
import { UserValidator } from '../validators/user.js'
import { OpeningHourValidator } from '../validators/opening_hour.js'

export default class UsersController {
  /**
   * Get all users (paginated)
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await User.query()
      .select(['id', 'firstname', 'lastname', 'email', 'roleId', 'genderId', 'createdAt'])
      .paginate(page, limit)

    return response.ok(users)
  }

  /**
   * Get current authenticated user
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    return response.ok(user)
  }

  /**
   * Get a single user by ID
   */
  async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    return response.ok({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      genderId: user.genderId,
      createdAt: user.createdAt,
    })
  }

  /**
   * Update user
   */
  async update({ params, request, response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    // Only allow users to update their own profile unless they're admins
    if (user.id !== auth_user.id && auth_user.roleId !== 3) {
      // 3 is ADMIN role
      return response.forbidden({ error: 'Not authorized to update this user' })
    }

    const data = await request.validateUsing(UserValidator.update)

    if (data.coordinate) {
      const { lat, lng } = data.coordinate
      // @ts-ignore - The point type expects a string in the format '(x,y)'
      data.coordinate = `(${lng},${lat})`
    }
    user.merge(data)
    await user.save()

    return response.ok(user)
  }

  async getOpeningHours({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user || user.roleId === 1) {
      return response.notFound({ error: 'User not found' })
    }

    let opening_hours = await OpeningHour.query().where('userId', user.id)

    return opening_hours
  }

  async addOpeningHour({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const user = await User.find(params.id)

    if (!user || user.roleId === 1 || (user.id !== auth_user.id && auth_user.roleId !== 3)) {
      return response.notFound({ error: 'User not found' })
    }

    const data = await request.validateUsing(OpeningHourValidator.create)

    // on récupère les heures d'ouverture en base de données
    const openingHours = await OpeningHour.query().where('userId', user.id)

    // on récupère le sid des heures d'ouverture
    const openingHoursIds = data.openingHours.map((openingHour) => openingHour.id)

    // on supprime les heures d'ouverture qui ne sont pas dans data
    for (const openingHour of openingHours) {
      if (!openingHoursIds.includes(openingHour.id)) {
        await openingHour.delete()
      }
    }

    // Create all opening hours in a transaction
    for (const openingHour of data.openingHours) {
      await OpeningHour.create({
        userId: user.id,
        dayOfWeek: openingHour.dayOfWeek,
        period: openingHour.period,
        openTime: openingHour.openTime,
        closeTime: openingHour.closeTime,
      })
    }

    return await OpeningHour.query().where('userId', user.id)
  }

  /**
   * Delete user
   */
  async destroy({ params, response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    // Only allow users to delete their own account or admins
    if (user.id !== auth_user.id && auth_user.roleId !== 3) {
      // 3 is ADMIN role
      return response.forbidden({ error: 'Not authorized to delete this user' })
    }

    await user.delete()

    return response.noContent()
  }

  async searchPatient({ request }: HttpContext) {
    const data = await request.validateUsing(UserValidator.search)

    const user = await User.query()
      .where('firstname', '=', data.firstName)
      .andWhere('lastname', '=', data.lastName)
      .andWhere('birthDate', '=', data.birthDate)
      .select(['id', 'firstname', 'lastname', 'email', 'createdAt'])
      .firstOrFail()

    return user
  }

  async showPatient({ params, response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User

    if (auth_user.roleId === 1) {
      return response.notFound({ error: 'User not found' })
    }

    const user = await User.query()
      .where('id', params.id)
      .select(['id', 'firstname', 'lastname', 'email', 'createdAt'])
      .firstOrFail()

    return user
  }
}
