import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Roles from '../enums/roles.js'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    { auth, response, request }: HttpContext,
    next: NextFn,
    guards: (keyof typeof Roles)[]
  ) {
    const roleIds = guards.map((guard) => Roles[guard])
    const userRole = auth.user?.roleId as Roles | undefined

    if (!userRole || !roleIds.includes(userRole)) {
      return response.unauthorized({ error: `This is restricted to ${guards.join(', ')} users` })
    }
    // code for middleware goes here. ABOVE THE NEXT CALL
    await next()
  }
}
