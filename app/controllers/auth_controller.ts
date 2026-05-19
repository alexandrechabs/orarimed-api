import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import PasswordReset from '#models/password_reset'
import { UserValidator } from '#validators/user'
import ReminderService from '#services/reminderService'
import { DateTime } from 'luxon'
@inject()
export default class AuthController {
  constructor(private reminderService: ReminderService) {}

  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(UserValidator.create)

    try {
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString()
      const verificationExpires = DateTime.now().plus({ hours: 24 })

      const user = await User.create({
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        roleId: data.roleId,
        acceptTerms: data.acceptTerms,
        language: data.language,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        active: false, // Désactiver le compte jusqu'à vérification
      })

      // send verification email
      await this.reminderService.scheduleReminderForEvent(
        user.id,
        '',
        0,
        user.email,
        DateTime.now().plus({ seconds: 10 }),
        'mail_email_verification',
        '',
        {
          userId: user.id,
          verificationToken: verificationToken,
          firstname: user.firstname,
        }
      )

      return response.created({
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          roleId: user.roleId,
          emailVerified: user.emailVerified,
        },
      })
    } catch (error: any) {
      return response.badRequest({
        error: 'Error during registration',
        details: error.message,
      })
    }
  }
  async verifyEmail({ request, response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const { code } = request.only(['code'])

    try {
      const user = await User.query()
        .where('id', auth_user.id)
        .andWhere('email_verification_token', code)
        .andWhere('email_verification_expires', '>', DateTime.now().toSQL())
        .first()

      if (!user) {
        return response.badRequest({
          error: 'Invalid or expired verification token',
        })
      }

      user.emailVerified = true
      user.emailVerificationToken = null
      user.emailVerificationExpires = null
      await user.save()

      return response.ok({
        message: 'Email verified successfully. Your account is now active.',
      })
    } catch (error: any) {
      return response.badRequest({
        error: 'Error verifying email',
        details: error.message,
      })
    }
  }

  async resendVerificationEmail({ response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User

    const user = await User.find(auth_user.id)
    try {
      if (!user) {
        return response.notFound({
          error: 'User not found',
        })
      }

      if (user.emailVerified) {
        return response.badRequest({
          error: 'Email already verified',
        })
      }

      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString()
      const verificationExpires = DateTime.now().plus({ hours: 24 })

      user.emailVerificationToken = verificationToken
      user.emailVerificationExpires = verificationExpires
      await user.save()

      await this.reminderService.scheduleReminderForEvent(
        user.id,
        '',
        0,
        user.email,
        DateTime.now().plus({ seconds: 10 }),
        'mail_email_verification',
        '',
        {
          userId: user.id,
          verificationToken: verificationToken,
          firstname: user.firstname,
        }
      )

      return response.ok({
        message: 'Verification email sent successfully',
      })
    } catch (error: any) {
      return response.badRequest({
        error: 'Error resending verification email',
        details: error.message,
      })
    }
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)

      if (!user.active) {
        return response.unauthorized({
          error: 'Account is not active',
        })
      }

      const token = await User.accessTokens.create(user)

      return response.ok({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          emailVerified: user.emailVerified,
        },
      })
    } catch (error: any) {
      return response.unauthorized({
        error: 'Invalid credentials',
      })
    }
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    try {
      const user = await User.findBy('email', email)

      if (!user) {
        return response.notFound({
          error: 'User not found',
        })
      }

      if (!user.active) {
        return response.unauthorized({
          error: 'Account is not active',
        })
      }

      const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
      const resetExpires = DateTime.now().plus({ hours: 24 })

      await PasswordReset.query().where('user_id', user.id).delete()
      await PasswordReset.create({ userId: user.id, token: resetToken, expiresAt: resetExpires })

      await this.reminderService.scheduleReminderForEvent(
        user.id,
        '',
        0,
        user.email,
        DateTime.now().plus({ seconds: 10 }),
        'mail_password_reset',
        '',
        {
          userId: user.id,
          resetToken: resetToken,
          firstname: user.firstname,
        }
      )

      return response.ok({
        message: 'Password reset email sent successfully',
      })
    } catch (error: any) {
      return response.badRequest({
        error: 'Error sending password reset email',
        details: error.message,
      })
    }
  }

  async resetPassword({ request, response }: HttpContext) {
    const { email, code, password } = request.only(['email', 'code', 'password'])

    try {
      const user = await User.findBy('email', email)
      if (!user) {
        return response.notFound({
          error: 'User not found',
        })
      }
      const passwordReset = await PasswordReset.query()
        .where('token', code)
        .andWhere('userId', user.id)
        .preload('user')
        .first()

      if (!passwordReset) {
        return response.badRequest({
          error: 'Invalid or expired reset token',
        })
      }

      if (passwordReset.expiresAt < DateTime.now()) {
        return response.badRequest({
          error: 'Reset token has expired',
        })
      }

      if (!user.active) {
        return response.unauthorized({
          error: 'Account is not active',
        })
      }

      user.password = password
      await user.save()

      // Delete the password reset record after successful reset
      await passwordReset.delete()

      return response.ok({
        message: 'Password reset successfully',
      })
    } catch (error: any) {
      return response.badRequest({
        error: 'Error resetting password',
        details: error.message,
      })
    }
  }
}
