import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import { registerSchema } from '#validators/user_validator'
import { SimpleMessagesProvider } from '@vinejs/vine'

@inject()
export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerSchema, {
      messagesProvider: new SimpleMessagesProvider({
        'email.email': 'Invalid email format',
        'email.unique': 'This email is already in use',
        'password.minLength': 'Password must be at least 8 characters',
        'password.maxLength': 'Password must not exceed 32 characters',
        'firstname.required': 'First name is required',
        'firstname.minLength': 'First name must be at least 2 characters',
        'firstname.maxLength': 'First name must not exceed 50 characters',
        'lastname.required': 'Last name is required',
        'lastname.minLength': 'Last name must be at least 2 characters',
        'lastname.maxLength': 'Last name must not exceed 50 characters',
        'genderId.number': 'Gender must be a number',
      }),
    })

    try {
      const user = await User.create({
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        roleId: 1, // Rôle USER par défaut
        genderId: data.genderId || 1,
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

  async me({ auth, response }: HttpContext) {
    return response.ok({
      user: auth.user,
    })
  }
}
