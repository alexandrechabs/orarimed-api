import Article from '#models/article'
import Locale from '#models/locale'
import R2Service from '#services/R2Service'
import { cuid } from '@adonisjs/core/helpers'
import sharp from 'sharp'
import { DateTime } from 'luxon'

export default class ArticleService {
  /**
   * CREATE ARTICLE
   */
  public async create(payload: {
    author?: string
    status?: string
    categoryId?: number
    featuredImage?: string
    localeId: number
    title: string
    slug: string
    content: string
    excerpt?: string
    seoTitle?: string
    seoDescription?: string
  }) {
    const article = await Article.create({
      author: payload.author,
      categoryId: payload.categoryId,
      featuredImage: payload.featuredImage,
      status: payload.status || 'draft',
      localeId: payload.localeId,
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
      excerpt: payload.excerpt,
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
    })

    return article
  }

  /**
   * UPDATE ARTICLE
   */
  public async update(articleId: number, payload: any) {
    const article = await Article.findOrFail(articleId)
    const r2Service = new R2Service()
    // save image if add or updated and delete old one if exist and updated
    if (payload.featuredImage && payload.featuredImage !== article.featuredImage) {
      // delete old image if exist
      if (article.featuredImage) {
        // delete old image logic here
        await r2Service.deleteFile(`article/${article.featuredImage}.webp`)
      }
      // upload new image in R2 from base 64 and convert it to webp with sharp
      const buffer = Buffer.from(
        payload.featuredImage.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      )
      const webpBuffer = await sharp(buffer).webp().toBuffer()
      const fileName = cuid()
      await r2Service.uploadFile(`article/${fileName}.webp`, webpBuffer, 'image/webp')
      payload.featuredImage = fileName
    }

    if (payload.status && payload.status === 'published' && article.status !== 'published') {
      payload.publishedAt = DateTime.now()
    }
    return await article.merge(payload).save()
  }

  /**
   * GET ARTICLE BY SLUG + LOCALE (SEO VIEW)
   */
  public async getBySlug(slug: string, localeCode: string) {
    return Article.query()
      .where('slug', slug)
      .whereHas('locale', (q) => {
        q.where('code', localeCode)
      })
      .preload('category', (q) => q.preload('translations'))
      .preload('tags', (q) => q.preload('translations'))
      .firstOrFail()
  }

  /**
   * LIST ARTICLES (HOMEPAGE / BLOG)
   */
  public async list(localeCode: string, page = 1, limit = 10) {
    const locale = await Locale.findByOrFail('code', localeCode)
    const paginated = await Article.query()
      .where('locale_id', locale.id)
      .where('status', 'published')
      .preload('category', (q) => q.preload('translations'))
      .preload('tags', (q) => q.preload('translations'))
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    const result = paginated.toJSON()

    result.data = result.data.map((article: any) => {
      if (article.category?.translations) {
        const selectedTranslation = article.category.translations.find(
          (translation: any) =>
            translation.localeId === article.localeId || translation.locale_id === article.localeId
        )

        article.category.translations = selectedTranslation ? [selectedTranslation] : []
        article.category.translation = selectedTranslation || null
      }
      return article
    })

    return result
  }

  /**
   * LIST ARTICLES FOR ADMIN
   */
  public async listForAdmin(page = 1, limit = 10) {
    const paginated = await Article.query()
      .orderBy('created_at', 'desc')
      .preload('locale')
      .preload('category', (q) => q.preload('translations'))
      .paginate(page, limit)

    const result = paginated.toJSON()

    result.data = result.data.map((article: any) => {
      if (article.category?.translations) {
        const selectedTranslation = article.category.translations.find(
          (translation: any) =>
            translation.localeId === article.localeId || translation.locale_id === article.localeId
        )

        article.category.translations = selectedTranslation ? [selectedTranslation] : []
        article.category.translation = selectedTranslation || null
      }
      return article
    })

    return result
  }
}
