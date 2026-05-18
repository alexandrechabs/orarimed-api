import Article from '#models/article'
import ArticleTranslation from '#models/articleTranslation'
import Locale from '#models/locale'
import R2Service from '#services/R2Service'
import { cuid } from '@adonisjs/core/helpers'
import sharp from 'sharp'
import { DateTime } from 'luxon'

export default class ArticleService {
  /**
   * CREATE ARTICLE + TRANSLATIONS
   */
  public async create(payload: {
    author?: string
    status?: string
    categoryId?: number
    featuredImage?: string
    translations: Array<{
      localeId: number
      title: string
      slug: string
      content: string
      excerpt?: string
      seoTitle?: string
      seoDescription?: string
    }>
  }) {
    const article = await Article.create({
      author: payload.author,
      categoryId: payload.categoryId,
      featuredImage: payload.featuredImage,
      status: payload.status || 'draft',
    })

    for (const t of payload.translations) {
      if (t.title) {
        await ArticleTranslation.create({
          articleId: article.id,
          localeId: t.localeId,
          title: t.title,
          slug: t.slug,
          content: t.content,
          excerpt: t.excerpt,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          isPublished: false,
        })
      }
    }

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
    await article.merge(payload).save()

    // update translations
    if (payload.translations && payload.translations.length > 0) {
      for (const t of payload.translations) {
        const translation = await ArticleTranslation.findByOrFail('id', t.id)

        await translation
          .merge({
            title: t.title,
            slug: t.slug,
            content: t.content,
            excerpt: t.excerpt,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
            isPublished: t.isPublished,
          })
          .save()
      }
    }

    return article
  }

  /**
   * GET ARTICLE BY SLUG + LOCALE (SEO VIEW)
   */
  public async getBySlug(slug: string, localeCode: string) {
    return ArticleTranslation.query()
      .where('slug', slug)
      .whereHas('locale', (q) => {
        q.where('code', localeCode)
      })
      .preload('article', (q) => {
        q.preload('category', (q2) => {
          q2.preload('translations')
        })
        q.preload('tags', (q2) => {
          q2.preload('translations')
        })
      })
      .firstOrFail()
  }

  /**
   * LIST ARTICLES (HOMEPAGE / BLOG)
   */
  public async list(localeCode: string, page = 1, limit = 10) {
    const locale = await Locale.findByOrFail('code', localeCode)

    return ArticleTranslation.query()
      .where('locale_id', locale.id)
      .where('is_published', true)
      .preload('article')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
  }

  /**
   * LIST ARTICLES FOR ADMIN
   */
  public async listForAdmin(page = 1, limit = 10) {
    return Article.query()
      .orderBy('created_at', 'desc')
      .preload('translations', (q) => {
        q.preload('locale')
      })
      .paginate(page, limit)
  }
}
