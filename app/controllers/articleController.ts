import { HttpContext } from '@adonisjs/core/http'
import ArticleService from '#services/ArticleService'
import User from '#models/user'

export default class ArticlesController {
  private service = new ArticleService()

  /**
   * CREATE ARTICLE
   */
  public async store({ request }: HttpContext) {
    const data = request.only([
      'author',
      'categoryId',
      'featuredImage',
      'translations',
    ])

    const article = await this.service.create(data)

    return {
      success: true,
      article,
    }
  }

  /**
   * PUBLISH
   */
  public async publish({ params, request }: HttpContext) {
    const localeCode = request.input('localeCode')

    const article = await this.service.publish(
      params.id,
      localeCode
    )

    return {
      success: true,
      article,
    }
  }

  /**
   * GET BY SLUG (SEO PAGE)
   */
  public async show({ params }: HttpContext) {
    const { slug, locale } = params

    const article = await this.service.getBySlug(slug, locale)

    return {
      article,
    }
  }

  /**
   * LIST BLOG
   */
  public async index({ auth, request, params }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const locale = params.locale

    if (auth_user.roleId === 4 || auth_user.roleId === 2) {
      // For admin
      return this.service.listForAdmin(page, limit)
    }
    
    return this.service.list(locale, page, limit)
  }
}