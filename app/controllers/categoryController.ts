import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { CategoryValidator } from '#validators/category'
import Category from '#models/category'
import CategoryTranslation from '#models/categoryTranslation'

export default class CategoryController {
  async index({}: HttpContext) {
    return await Category.query().preload('translations')
  }

  async create({ request }: HttpContext) {
    const payload = await request.validateUsing(CategoryValidator.create)

    let category = await Category.create({})
    payload.translations.forEach(async (t) => {
      await CategoryTranslation.create({
        categoryId: category.id,
        localeId: t.localeId,
        name: t.name,
      })
    })

    return await Category.query().where('id', category.id).preload('translations').firstOrFail()
  }

  async show({ params, response }: HttpContext) {
    const category = await Category.find(params.id)

    if (!category) {
      return response.notFound({ message: 'Catégorie non trouvée' })
    }

    return await Category.query().where('id', params.id).preload('translations').firstOrFail()
  }

  async update({ params, request, response }: HttpContext) {
    const category = await Category.find(params.id)

    if (!category) {
      return response.notFound({ message: 'Catégorie non trouvée' })
    }

    const payload = await request.validateUsing(CategoryValidator.update)
    const trx = await db.transaction()

    try {
      category.useTransaction(trx)
      await category.save()
      for (const t of payload.translations ?? []) {
        await CategoryTranslation.updateOrCreate(
          {
            categoryId: category.id,
            localeId: t.localeId,
          },
          {
            name: t.name,
          },
          { client: trx }
        )
      }

      await CategoryTranslation.query({ client: trx })
        .where('category_id', category.id)
        .whereNotIn(
          'locale_id',
          (payload.translations ?? []).map((t) => t.localeId)
        )
        .delete()
      await trx.commit()
      return await Category.query().where('id', params.id).preload('translations').firstOrFail()
    } catch (error) {
      await trx.rollback()
      console.error(error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la mise à jour de la catégorie',
      })
    }
  }

  async delete({ params, response }: HttpContext) {
    const category = await Category.find(params.id)

    if (!category) {
      return response.notFound({ message: 'Catégorie non trouvée' })
    }

    await category.delete()
    return { success: true, message: 'Catégorie supprimée avec succès' }
  }
}
