import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuditLog from '#models/audit_log'

export default class AuditLogMiddleware {
  // Liste des chemins à ignorer
  private excludedPaths = ['/health', '/metrics', '/favicon.ico']

  async handle(ctx: HttpContext, next: NextFn) {
    const { request } = ctx
    // Ignorer les requêtes OPTIONS et HEAD
    if (['OPTIONS', 'HEAD'].includes(request.method())) {
      return next()
    }

    // Ignorer les chemins exclus
    if (this.excludedPaths.some((path) => request.url().startsWith(path))) {
      return next()
    }

    // Démarrer le chrono pour mesurer la durée de la requête
    const start = process.hrtime()

    try {
      // Exécuter la requête
      await next()

      // Calculer la durée de la requête en millisecondes
      const duration = this.calculateDuration(start)

      // Enregistrer la requête dans les logs d'audit (de manière asynchrone pour ne pas ralentir la réponse)
      this.logRequest(ctx, duration).catch((error: Error) =>
        console.error("Erreur lors de l'enregistrement du log d'audit:", error)
      )
    } catch (error) {
      // Calculer la durée même en cas d'erreur
      const duration = this.calculateDuration(start)

      // Enregistrer l'erreur dans les logs d'audit
      this.logRequest(ctx, duration, error).catch((logError: Error) =>
        console.error("Erreur lors de l'enregistrement du log d'erreur d'audit:", logError)
      )

      // Renvoyer l'erreur au gestionnaire d'erreurs global
      throw error
    }
  }

  private calculateDuration(start: [number, number]): number {
    const [seconds, nanoseconds] = process.hrtime(start)
    return Math.round(seconds * 1000 + nanoseconds / 1000000)
  }

  private async logRequest(ctx: HttpContext, duration: number, error?: unknown) {
    const { request, response } = ctx
    try {
      const userId = ctx.auth?.user?.id ? ctx.auth.user.id : null
      const statusCode = response.getStatus()
      const method = request.method()
      const path = request.url()
      const userAgent = request.header('user-agent')
      const ipAddress = request.ip()

      // Ne pas logger les requêtes de santé et métriques
      if (path.startsWith('/health') || path.startsWith('/metrics')) {
        return
      }

      // Créer un enregistrement d'audit
      await AuditLog.create({
        action: `http.${method.toLowerCase()}`,
        url: path,
        userId,
        userAgent,
        ipAddress,
        duration,
        metadata: {
          method,
          statusCode,
          query: request.qs(),
          params: request.params(),
          error: error
            ? error instanceof Error
              ? {
                  message: error.message,
                  name: error.name,
                  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                  ...((error as any).code ? { code: (error as any).code } : {}),
                }
              : error !== undefined
                ? String(error)
                : undefined
            : undefined,
        },
      })
    } catch (error) {
      console.error('Erreur critique dans le middleware AuditLog:', error)
      // Ne pas propager l'erreur pour éviter de perturber le flux normal
    }
  }
}
