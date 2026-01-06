import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import { UserValidator } from '#validators/user'

@inject()
export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(UserValidator.create)

    try {
      const user = await User.create({
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        roleId: 1, // Rôle USER par défaut
      })

      const token = await User.accessTokens.create(user)

      return response.created({
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          roleId: user.roleId,
        },
        token,
      })
    } catch (error) {
      return response.badRequest({
        error: 'Error during registration',
        details: error.message,
      })
    }
  }
  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)
      const token = await User.accessTokens.create(user)

      return response.ok({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
        },
      })
    } catch (error) {
      return response.unauthorized({
        error: 'Invalid credentials',
      })
    }
  }
}
