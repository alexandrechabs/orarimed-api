import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { SpecialityValidator } from '#validators/speciality'
import Speciality from '#models/speciality'
import SubSpeciality from '#models/sub_speciality'
import SpecialityTranslation from '#models/speciality_translation'
import SubSpecialityTranslation from '#models/sub_speciality_translation'

export default class SpecialitiesController {
  async index({}: HttpContext) {
    return await Speciality.query()
      .preload('translations')
      .preload('subSpecialities', (q) => q.preload('translations'))
      .orderBy('position', 'asc')
  }

  async create({ request, response }: HttpContext) {
    const payload = await request.validateUsing(SpecialityValidator.create)

    if (!Array.isArray(payload.specialities)) {
      return response.badRequest({ message: 'Payload invalide' })
    }

    const trx = await db.transaction()

    try {
      const savedIds: number[] = []

      for (const item of payload.specialities) {
        /* ---------------------------------
           SPECIALITY
        ---------------------------------- */
        const speciality = item.id
          ? await Speciality.findOrFail(item.id, { client: trx })
          : new Speciality()

        speciality.slug = item.slug
        speciality.icon = item.icon ?? null
        speciality.color = item.color ?? null
        speciality.position = item.position
        speciality.useTransaction(trx)
        await speciality.save()
        savedIds.push(speciality.id)

        /* ---------------------------------
           TRANSLATIONS
        ---------------------------------- */
        for (const t of item.translations ?? []) {
          await SpecialityTranslation.updateOrCreate(
            {
              specialityId: speciality.id,
              locale: t.locale,
            },
            {
              name: t.name,
            },
            { client: trx }
          )
        }

        /* ---------------------------------
           CLEAN REMOVED TRANSLATIONS (OPTIONAL)
        ---------------------------------- */
        await SpecialityTranslation.query({ client: trx })
          .where('speciality_id', speciality.id)
          .whereNotIn(
            'locale',
            (item.translations ?? []).map((t) => t.locale)
          )
          .delete()

        /* ---------------------------------
           SUB-SPECIALITIES
        ---------------------------------- */
        const subIds: number[] = []

        for (const sub of item.subSpecialities ?? []) {
          const subSpeciality = sub.id
            ? await SubSpeciality.findOrFail(sub.id, { client: trx })
            : new SubSpeciality()

          subSpeciality.specialityId = speciality.id
          subSpeciality.slug = sub.slug
          subSpeciality.useTransaction(trx)
          await subSpeciality.save()
          subIds.push(subSpeciality.id)

          for (const t of sub.translations ?? []) {
            await SubSpecialityTranslation.updateOrCreate(
              {
                subSpecialityId: subSpeciality.id,
                locale: t.locale,
              },
              {
                name: t.name,
              },
              { client: trx }
            )
          }

          await SubSpecialityTranslation.query({ client: trx })
            .where('sub_speciality_id', subSpeciality.id)
            .whereNotIn(
              'locale',
              (sub.translations ?? []).map((t) => t.locale)
            )
            .delete()
        }

        /* ---------------------------------
           CLEAN REMOVED SUB-SPECIALITIES
        ---------------------------------- */
        await SubSpeciality.query({ client: trx })
          .where('speciality_id', speciality.id)
          .whereNotIn('id', subIds)
          .delete()
      }

      /* ---------------------------------
         OPTIONAL: DELETE REMOVED SPECIALITIES
      ---------------------------------- */
      await Speciality.query({ client: trx }).whereNotIn('id', savedIds).delete()

      await trx.commit()

      return await Speciality.query()
        .preload('translations')
        .preload('subSpecialities', (q) => q.preload('translations'))
        .orderBy('position', 'asc')
    } catch (error) {
      await trx.rollback()
      console.error(error)

      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la sauvegarde des spécialités',
      })
    }
  }
}
