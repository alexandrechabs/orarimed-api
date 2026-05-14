import Article from '#models/article'
import ArticleTranslation from '#models/articleTranslation'
import Locale from '#models/locale'

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
      console.log(t)

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

    return article
  }

  /**
   * PUBLISH ARTICLE (ALL OR PER LOCALE)
   */
  public async publish(articleId: number, localeCode?: string) {
    const article = await Article.findOrFail(articleId)

    if (localeCode) {
      const locale = await Locale.findByOrFail('code', localeCode)

      await ArticleTranslation.query()
        .where('article_id', articleId)
        .where('locale_id', locale.id)
        .update({ is_published: true })
    } else {
      await ArticleTranslation.query().where('article_id', articleId).update({ is_published: true })

      article.status = 'published'
      article.publishedAt = new Date() as any
      await article.save()
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
