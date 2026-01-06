import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { UserValidator } from '../validators/user.js'

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
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    // Only allow users to update their own profile unless they're admins
    if (user.id !== auth.user?.id && auth.user?.roleId !== 3) {
      // 3 is ADMIN role
      return response.forbidden({ error: 'Not authorized to update this user' })
    }

    const data = await request.validateUsing(UserValidator.update)

    console.log(data)

    user.merge(data)
    await user.save()

    return response.ok(user)
  }

  /**
   * Delete user
   */
  async destroy({ params, response, auth }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    // Only allow users to delete their own account or admins
    if (user.id !== auth.user?.id && auth.user?.roleId !== 3) {
      // 3 is ADMIN role
      return response.forbidden({ error: 'Not authorized to delete this user' })
    }

    await user.delete()

    return response.noContent()
  }
}
