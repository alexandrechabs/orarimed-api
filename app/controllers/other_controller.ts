import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ReminderService from '#services/reminderService'
import { DateTime } from 'luxon'
import User from '#models/user'

@inject()
export default class OtherController {
  constructor(private reminderService: ReminderService) {}

  async form({ request, response }: HttpContext) {
    const { name, phone, email, message } = request.only(['name', 'phone', 'email', 'message'])

    // send mail
    await this.reminderService.scheduleReminderForEvent(
      'form',
      '',
      0,
      '',
      DateTime.now().plus({ seconds: 10 }),
      'mail_contact_form',
      '',
      {
        name: name,
        phone: phone,
        email: email,
        message: message,
      }
    )

    return response.ok({
      message: 'Form submitted successfully',
    })
  }

  async share({ request, response }: HttpContext) {
    const path = request.url().replace('/share', '')

    if (path.startsWith('/doctor/')) {
      const doctorId = path.split('/')[3]

      const doctor = await User.query()
        .where('doctorIdentifier', doctorId)
        .select('id', 'firstname', 'lastname', 'avatar', 'language', 'specialityId')
        .preload('speciality', (query) => {
          query.preload('translations')
        })
        .preload('subSpecialitiesUsers', (query) => {
          query.preload('subSpeciality', (subQuery) => {
            subQuery.preload('translations')
          })
        })
        .preload('centerUsers', (query) => {
          query.preload('center', (subQuery) => {
            subQuery.select('id', 'name', 'city')
          })
        })
        .first()

      if (!doctor) {
        return response.notFound('Doctor not found')
      }

      const speciality =
        doctor.speciality?.translations?.find((t) => t.locale === 'sq')?.name ??
        doctor.speciality?.slug ??
        ''

      const title = `Dr ${doctor.firstname} ${doctor.lastname} | ${speciality}`
      const center =
        doctor.centerUsers && doctor.centerUsers.length > 0
          ? doctor.centerUsers[0].center.name
          : 'OrariMed'

      const description = `Dr. ${doctor.firstname} ${doctor.lastname}, specialist në ${speciality}, i shikuar në ${center} në ${doctor.city}. Gjeni disponibilitetin, shërbimet (konsultim, telekonsultim, eksamina) dhe recenzat e pacientëve. Rezervoni një kohë të sigurt në disa klikime.`

      const image = doctor.avatar
        ? `https://orarimed.com/api/user/${doctor.id}/avatar/${doctor.avatar}`
        : 'https://orarimed.com/default-avatar.png'

      const url = `https://orarimed.com${path}`
      const keywords = [
        title,
        speciality,
        doctor.city,
        center,
        doctor.subSpecialitiesUsers
          .map((sub) => sub.subSpeciality?.translations?.find((t) => t.locale === 'sq')?.name)
          .join(', '),
      ]
        .filter(Boolean)
        .join(', ')

      return response.header('Content-Type', 'text/html').send(
        this.renderMetaPage({
          title,
          description,
          keywords,
          image,
          url,
        })
      )
    }

    return response.header('Content-Type', 'text/html').send(
      this.renderMetaPage({
        title: 'OrariMed - Rezervo takimin mjekësor online në Shqipëri',
        description:
          'Gjej dhe rezervo takimin tënd mjekësor në Tiranë dhe në të gjithë Shqipërinë. Mjekë, dentistë dhe laboratorë të verifikuar. Rezervim i shpejtë 24/7.',
        keywords:
          'mjek, takim mjekësor, doktor, dentist, laborator, Tiranë, Shqipëri, rezervim online, kardiolog, dermatolog, pediatër',
        image: 'https://orarimed.com/home.png',
        url: `https://orarimed.com${path}`,
      })
    )
  }

  private renderMetaPage({
    title,
    description,
    keywords,
    image,
    url,
  }: {
    title: string
    description: string
    keywords: string
    image: string
    url: string
  }) {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
        <meta charset="utf-8" />

        <title>${title}</title>

        <meta name="description" content="${description}" />

        <meta name="keywords" content="${keywords}" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:site_name" content="Orarimed" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />

        <meta http-equiv="refresh" content="0;url=${url}" />

        </head>
        <body>
        <p>Redirection...</p>

        <script>
        window.location.href = "${url}";
        </script>
        </body>
        </html>
        `
  }
}
