import { HttpContext } from '@adonisjs/core/http'
import Article from '#models/article'
import Speciality from '#models/speciality'
import User from '#models/user'
import Center from '#models/centers'

const BASE_URL = process.env.SITE_URL ?? 'https://orarimed.com'
const staticUrls = [
  '/',
  '/specialities',
  '/actualities',
  '/contact',
  '/professionals',
  '/search',
]

function createUrlEntry(path: string) {
  const lastmod = new Date().toISOString().split('T')[0]
  return `  <url>\n    <loc>${BASE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
}

function buildSitemapXml(urls: string[]) {
  const urlset = urls.map(createUrlEntry).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`
}

export default class SitemapController {
  async index({ response }: HttpContext) {
    const [specialities, articles, doctors, centers] = await Promise.all([
      Speciality.query().select('slug'),
      Article.query()
        .where('status', 'published')
        .select('slug', 'locale_id')
        .preload('locale'),
      User.query()
        .where('role_id', 2)
        .where('active', true)
        .where('visible', true)
        .select('doctor_identifier', 'speciality_id')
        .preload('speciality', (query) => query.select('slug')),
      Center.query()
        .where('visible', true)
        .where('active', true)
        .select('center_identifier', 'speciality_id')
        .preload('speciality', (query) => query.select('slug')),
    ])

    const specialityUrls = specialities
      .map((speciality) => speciality.slug)
      .filter(Boolean)
      .map((slug) => `/specialities/${slug}`)

    const articleUrls = articles
      .map((article) => {
        const localeCode = article.locale?.code
        return article.slug && localeCode
          ? `/actualities/${localeCode}/${article.slug}`
          : null
      })
      .filter(Boolean) as string[]

    const doctorUrls = doctors
      .map((doctor) =>
        doctor.doctorIdentifier && doctor.speciality?.slug
          ? `/doctor/${doctor.speciality.slug}/${doctor.doctorIdentifier}`
          : null,
      )
      .filter(Boolean) as string[]

    const centerUrls = centers
      .map((center) =>
        center.centerIdentifier && center.speciality?.slug
          ? `/center/${center.speciality.slug}/${center.centerIdentifier}`
          : null,
      )
      .filter(Boolean) as string[]

    const uniqueUrls = [
      ...new Set([
        ...staticUrls,
        ...specialityUrls,
        ...articleUrls,
        ...doctorUrls,
        ...centerUrls,
      ]),
    ]

    response.header('Content-Type', 'application/xml')
    return buildSitemapXml(uniqueUrls)
  }
}
