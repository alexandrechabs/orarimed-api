import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import OpeningHour from '#models/opening_hour'
import { UserValidator } from '../validators/user.js'
import { OpeningHourValidator } from '../validators/opening_hour.js'
import Speciality from '#models/speciality'
import SubSpeciality from '#models/sub_speciality'
import R2Service from '#services/R2Service'
import app from '@adonisjs/core/services/app'
import sharp from 'sharp'
import * as fs from 'node:fs/promises'
import { cuid } from '@adonisjs/core/helpers'
import { Readable } from 'node:stream'

export default class UsersController {
  /**
   * Get all users (paginated)
   */
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await User.query()
      .select(['id', 'firstname', 'lastname', 'email', 'roleId', 'genderId', 'createdAt'])
      .paginate(page, limit)

    return users
  }

  /**
   * Get current authenticated user
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    return await User.query().where('id', user.id).preload('subSpecialitiesUsers').firstOrFail()
  }

  public async upload({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as User
    let user = await User.find(params.id)

    if (!user || user.id !== auth_user.id) {
      return response.notFound({ error: 'User not found' })
    }

    // utile ou non ?
    if (auth_user.roleId === 1) {
      return response.forbidden({ error: 'Not authorized to upload files' })
    }

    const r2Service = new R2Service()

    if (user.avatar) {
      await r2Service.deleteFile(`user/${user.avatar}.webp`)
    }

    const file = request.file('file', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!file) {
      return response.badRequest({ message: 'Aucun fichier téléchargé' })
    }

    const tmpPath = app.tmpPath('uploads')
    const baseName = cuid()

    try {
      // 1️⃣ Fichier temporaire
      await file.move(tmpPath)

      if (!file.filePath) {
        throw new Error('Échec du déplacement du fichier')
      }

      const buffer = await sharp(file.filePath)
        .resize(800, 800, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: 80 })
        .toBuffer()

      const filename = `user/${baseName}.webp`

      await r2Service.uploadFile(filename, buffer, 'image/webp')

      await user.merge({ avatar: baseName }).save()

      // 3️⃣ Nettoyage
      await fs.unlink(file.filePath)

      return response.send({
        image: baseName,
      })
    } catch (error) {
      if (file.filePath) {
        try {
          await fs.unlink(file.filePath)
        } catch {}
      }

      console.error(error)

      return response.status(500).send({
        error: 'Erreur lors du téléchargement du fichier',
      })
    }
  }

  async getAvatar({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user || !user.avatar || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    const r2Service = new R2Service()
    const object = await r2Service.getImage(`user/${user.avatar}.webp`)

    // Headers importants
    response.header('Content-Type', object.ContentType || 'application/octet-stream')
    response.header('Content-Length', object.ContentLength?.toString() || '')
    response.header('Cache-Control', 'private, max-age=3600')

    return response.stream(object.Body as Readable)
  }

  /**
   * Get a single user by ID
   */
  async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    return {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      genderId: user.genderId,
      createdAt: user.createdAt,
    }
  }

  /**
   * Update user
   */
  async update({ params, request, response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    // Only allow users to update their own profile unless they're admins
    if (user.id !== auth_user.id && auth_user.roleId !== 3) {
      // 3 is ADMIN role
      return response.forbidden({ error: 'Not authorized to update this user' })
    }

    const data = await request.validateUsing(UserValidator.update)

    if (data.coordinate) {
      const { lat, lng } = data.coordinate
      // @ts-ignore - The point type expects a string in the format '(x,y)'
      data.coordinate = `(${lng},${lat})`
    }
    user.merge(data)
    await user.save()

    return await User.query().where('id', user.id).preload('subSpecialitiesUsers').firstOrFail()
  }

  async getOpeningHours({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user || user.roleId === 1) {
      return response.notFound({ error: 'User not found' })
    }

    let opening_hours = await OpeningHour.query().where('userId', user.id)

    return opening_hours
  }

  async addOpeningHour({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const user = await User.find(params.id)

    if (!user || user.roleId === 1 || (user.id !== auth_user.id && auth_user.roleId !== 3)) {
      return response.notFound({ error: 'User not found' })
    }

    const data = await request.validateUsing(OpeningHourValidator.create)

    // on récupère les heures d'ouverture en base de données
    const openingHours = await OpeningHour.query().where('userId', user.id)

    // on récupère le sid des heures d'ouverture
    let openingHoursIds: number[] = []
    if (data.openingHours) {
      data.openingHours.map((openingHour) => openingHour.id)
    }
    // on supprime les heures d'ouverture qui ne sont pas dans data
    for (const openingHour of openingHours) {
      if (!openingHoursIds.includes(openingHour.id)) {
        await openingHour.delete()
      }
    }

    if (data.openingHours) {
      // Create all opening hours in a transaction
      for (const openingHour of data.openingHours) {
        await OpeningHour.create({
          userId: user.id,
          dayOfWeek: openingHour.dayOfWeek,
          period: openingHour.period,
          openTime: openingHour.openTime,
          closeTime: openingHour.closeTime,
        })
      }
    }

    return await OpeningHour.query().where('userId', user.id)
  }

  /**
   * Delete user
   */
  async destroy({ params, response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    // Only allow users to delete their own account or admins
    if (user.id !== auth_user.id && auth_user.roleId !== 3) {
      // 3 is ADMIN role
      return response.forbidden({ error: 'Not authorized to delete this user' })
    }

    await user.delete()

    return response.noContent()
  }

  async searchPatient({ request }: HttpContext) {
    const data = await request.validateUsing(UserValidator.search)

    const user = await User.query()
      .where('firstname', '=', data.firstName)
      .andWhere('lastname', '=', data.lastName)
      .andWhere('birthDate', '=', data.birthDate)
      .select(['id', 'firstname', 'lastname', 'email', 'createdAt'])
      .firstOrFail()

    return user
  }

  async showPatient({ params, response, auth }: HttpContext) {
    const auth_user = auth.user! as unknown as User

    if (auth_user.roleId === 1) {
      return response.notFound({ error: 'User not found' })
    }

    const user = await User.query()
      .where('id', params.id)
      .select(['id', 'firstname', 'lastname', 'email', 'createdAt'])
      .firstOrFail()

    return user
  }

  async showDoctor({ params }: HttpContext) {
    const user = await User.query()
      .where('doctorIdentifier', params.id)
      .select([
        'id',
        'firstname',
        'lastname',
        'email',
        'avatar',
        'createdAt',
        'specialityId',
        'phoneNumber',
        'city',
        'bio',
        'address',
      ])
      .preload('subSpecialitiesUsers', (query) => {
        query.preload('subSpeciality', (query) => {
          query.preload('translations')
        })
      })
      .preload('speciality', (query) => {
        query.preload('translations')
      })
      .preload('openingHours')
      .firstOrFail()

    return user
  }

  async searchDoctorAutoComplete({ request }: HttpContext) {
    // add validator
    const data = await request.validateUsing(UserValidator.searchDoctorAutoComplete)
    // retourner toutes les catégories ou la tranduction de la catégorie correspondant au mot recherché
    const specialities = await Speciality.query()
      .whereHas('translations', (query) => {
        query.where('locale', data.locale).whereILike('name', `%${data.q}%`)
      })
      .preload('translations', (query) => {
        query.where('locale', data.locale)
      })
    const subSpecialities = await SubSpeciality.query()
      .whereHas('translations', (query) => {
        query.where('locale', data.locale).whereILike('name', `%${data.q}%`)
      })
      .preload('translations', (query) => {
        query.where('locale', data.locale)
      })

    const doctors = await User.query()
      .where('role_id', 2)
      .whereILike('lastname', `%${data.q}%`)
      .select([
        'id',
        'firstname',
        'lastname',
        'city',
        'specialityId',
        'doctorIdentifier',
        'avatar',
        'createdAt',
      ])
      .preload('speciality', (query) => {
        query.preload('translations')
      })
      .limit(10)

    let result = { specialities, subSpecialities, doctors }

    return result
  }

  async searchDoctor({ request, response }: HttpContext) {
    try {
      // Récupérer et valider les paramètres de la requête
      const { lat, lng, q, address, locale } = await request.validateUsing(
        UserValidator.searchDoctor
      )

      console.log('Recherche de médecins avec les paramètres:', {
        lat,
        lng,
        q,
        address,
        locale,
      })

      // Construire la requête de base
      const query = User.query()
        .where('role_id', 2) // Filtre pour les médecins
        .whereNotNull('coordinate')
        .whereRaw(
          `ST_DWithin(
          ST_MakePoint(?, ?)::geography,
          ST_MakePoint(ST_X(coordinate::geometry), ST_Y(coordinate::geometry))::geography,
          10000
        )`,
          [lng, lat] // PostgreSQL utilise l'ordre (longitude, latitude)
        )

      // Filtrer par spécialité ou sous-spécialité si un terme de recherche est fourni
      if (q) {
        query.where((subQuery) => {
          // Recherche dans les spécialités
          subQuery
            .whereHas('speciality', (specialityQuery) => {
              specialityQuery.whereHas('translations', (translationQuery) => {
                translationQuery.where('name', 'ilike', `%${q}%`).andWhere('locale', locale)
              })
            })
            // OU recherche dans les sous-spécialités
            .orWhereHas('subSpecialities', (subSpecialityQuery) => {
              subSpecialityQuery.whereHas('translations', (translationQuery) => {
                translationQuery.where('name', 'ilike', `%${q}%`).andWhere('locale', locale)
              })
            })
        })
      }

      // Sélectionner les champs nécessaires
      query.select([
        'users.id',
        'users.firstname',
        'users.lastname',
        'users.email',
        'users.avatar',
        'users.speciality_id',
        'users.city',
        'users.address',
        'users.coordinate',
        'users.created_at',
      ])

      // Inclure la distance dans les résultats
      query.select(
        User.query().client.raw(
          'ST_Distance(ST_MakePoint(?, ?)::geography, ST_MakePoint(ST_X(coordinate::geometry), ST_Y(coordinate::geometry))::geography) as distance',
          [lng, lat]
        )
      )

      // Trier par distance
      query.orderBy('distance', 'asc')

      // Limiter les résultats
      query.limit(50)

      // Charger les relations nécessaires
      query.preload('speciality', (query) => {
        query.preload('translations')
      })
      query.preload('subSpecialities', (query) => {
        query.preload('translations')
      })

      const doctors = await query

      return doctors
    } catch (error) {
      console.error('Erreur lors de la recherche de médecins:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la recherche de médecins',
        details: error.message,
      })
    }
  }
}
