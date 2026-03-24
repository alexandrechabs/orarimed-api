import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import { UserValidator } from '#validators/user'
import ReminderService from '#services/reminderService'
import { DateTime } from 'luxon'

@inject()
export default class AuthController {
  constructor(private reminderService: ReminderService) {}

  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(UserValidator.create)

    try {
      const user = await User.create({
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        roleId: data.roleId,
        acceptTerms: data.acceptTerms,
        language: data.language,
      })

      // send mail create account
      let mail_type: any = 'mail_create_account'
      if (data.roleId === 2) {
        mail_type = 'mail_create_account_doctor'
      } else if (data.roleId === 3) {
        mail_type = 'mail_create_account_secretary'
      } else {
        mail_type = 'mail_create_account'
      }

      await this.reminderService.scheduleReminderForEvent(
        user.id,
        '',
        0,
        user.email,
        DateTime.now().plus({ seconds: 10 }),
        mail_type,
        '',
        {
          userId: user.id,
        }
      )

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
