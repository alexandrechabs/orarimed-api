import { HttpContext } from '@adonisjs/core/http'
import ArticleService from '#services/ArticleService'
import Article from '#models/article'
import { Readable } from 'stream'
import R2Service from '#services/R2Service'

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
      'localeId',
      'title',
      'slug',
      'content',
      'excerpt',
      'seoTitle',
      'seoDescription',
      'status',
    ])

    const article = await this.service.create(data)

    return {
      success: true,
      article,
    }
  }

  /**
   * UPDATE ARTICLE
   */
  public async update({ params, request }: HttpContext) {
    const data = request.only([
      'author',
      'categoryId',
      'status',
      'featuredImage',
      'title',
      'slug',
      'content',
      'excerpt',
      'seoTitle',
      'seoDescription',
    ])

    const article = await this.service.update(params.id, data)

    return {
      success: true,
      article,
    }
  }

  /**
   * GET ARTICLE IMAGE
   */
  public async image({ auth, params, response }: HttpContext) {
    await auth.check()
    const authUser = auth.user

    const article = await Article.findOrFail(params.id)

    if (
      !article.featuredImage ||
      params.imageId !== article.featuredImage ||
      (article.status !== 'published' &&
        (!authUser || (authUser.roleId !== 4 && authUser.roleId !== 2)))
    ) {
      return response.status(404).json({ message: 'Image non trouvée' })
    }
    const r2Service = new R2Service()
    let img = await r2Service.getImage(`article/${article.featuredImage}.webp`)

    // Headers importants
    response.header('Content-Type', img.ContentType || 'application/octet-stream')
    response.header('Content-Length', img.ContentLength?.toString() || '')
    response.header('Cache-Control', 'private, max-age=3600')

    return response.stream(img.Body as Readable)
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
  public async index({ auth, request }: HttpContext) {
    await auth.check()
    const authUser = auth.user
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const locale = request.input('locale')

    if (authUser && (authUser.roleId === 4 || authUser.roleId === 2)) {
      // For admin
      return this.service.listForAdmin(page, limit)
    }

    return this.service.list(locale, page, limit)
  }
}
