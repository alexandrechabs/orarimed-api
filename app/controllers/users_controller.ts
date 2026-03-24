import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import User from '#models/user'
import Event from '#models/events'
import Speciality from '#models/speciality'
import SubSpeciality from '#models/sub_speciality'
import OpeningHour from '#models/opening_hour'
import Reason from '#models/reasons'
import Contact from '#models/contacts'
import Center from '#models/centers'
import R2Service from '#services/R2Service'
import DateSlotService from '#services/DateSlotService'
import ReminderService from '#services/reminderService'
import { UserValidator } from '../validators/user.js'
import { OpeningHourValidator } from '../validators/opening_hour.js'
import { ReasonValidator } from '../validators/reason.js'
import sharp from 'sharp'
import * as fs from 'node:fs/promises'
import { Readable } from 'node:stream'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'

@inject()
export default class UsersController {
  constructor(private reminderService: ReminderService) {}
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

    // Check if user exists and if the user is the same as the authenticated user for doctor (roleId = 2) or if user is admin (roleId = 4)
    if (!user || (user.id !== auth_user.id && auth_user.roleId !== 4)) {
      return response.notFound({ error: 'User not found' })
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
    if (user.id !== auth_user.id && auth_user.roleId !== 4) {
      // 4 is ADMIN role
      return response.forbidden({ error: 'Not authorized to update this user' })
    }

    const data = await request.validateUsing(UserValidator.update)

    if (data.coordinate) {
      const { x, y } = data.coordinate
      // @ts-ignore - The point type expects a string in the format '(x,y)'
      data.coordinate = `(${y},${x})`
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

    if (!user || user.roleId === 1 || (user.id !== auth_user.id && auth_user.roleId !== 4)) {
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
          timeZone: openingHour.timeZone,
        })
      }
    }

    return await OpeningHour.query().where('userId', user.id)
  }

  async getReasonsClient({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    let reasons = await Reason.query().where('userId', user.id).andWhere('type', 'appointment')

    return reasons
  }

  async getReasons({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user || user.roleId !== 2) {
      return response.notFound({ error: 'User not found' })
    }

    let reasons = await Reason.query().where('userId', user.id)

    return reasons
  }

  async addReasons({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const user = await User.find(params.id)

    if (!user || user.roleId === 1 || (user.roleId === 2 && user.id !== auth_user.id)) {
      return response.notFound({ error: 'User not found' })
    }
    let data = await request.validateUsing(ReasonValidator.create)

    const reasons = await Reason.query().where('userId', user.id)

    let reasonsIds: (number | undefined)[] = []
    if (data.reasons) {
      reasonsIds = data.reasons
        .filter((reason) => reason.id !== undefined)
        .map((reason) => reason.id)
    }

    // on supprime les heures d'ouverture qui ne sont pas dans data
    for (const reason of reasons) {
      if (!reasonsIds.includes(reason.id)) {
        await reason.delete()
      }
    }

    if (data.reasons) {
      // Create all opening hours in a transaction
      for (const reason of data.reasons) {
        if (reason.id) {
          const existingReason = await Reason.find(reason.id)
          if (existingReason) {
            existingReason.merge({
              name: reason.name,
              duration: reason.duration,
              color: reason.color,
              type: reason.type,
            })
            await existingReason.save()
          }
        } else {
          await Reason.create({
            userId: user.id,
            name: reason.name,
            duration: reason.duration,
            color: reason.color,
            type: reason.type,
          })
        }
      }
    }

    return await Reason.query().where('userId', user.id)
  }

  async searchPatient({ auth, request }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const data = await request.validateUsing(UserValidator.search)

    const user = await Contact.query()
      .where('practitionerId', auth_user.id)
      .andWhereRaw('unaccent(lower(lastname)) ILIKE unaccent(lower(?))', [`%${data.search}%`])
      .select(['id', 'firstname', 'lastname', 'email', 'phoneNumber', 'createdAt'])
      .limit(10)

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
      .where('active', true)
      .where('visible', true)
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

    const centers = await Center.query()
      .where('active', true)
      .where('visible', true)
      .whereILike('name', `%${data.q}%`)
      .select(['id', 'name', 'city', 'specialityId', 'centerIdentifier', 'avatar', 'createdAt'])
      .preload('speciality', (query) => {
        query.preload('translations')
      })
      .limit(10)

    let result = { specialities, subSpecialities, doctors, centers }

    return result
  }

  async searchDoctor({ request, response }: HttpContext) {
    try {
      // Récupérer et valider les paramètres de la requête
      const { lat, lng, q, locale } = await request.validateUsing(UserValidator.searchDoctor)

      // Construire la requête de base
      const query = User.query()
        .where('role_id', 2) // Filtre pour les médecins
        .where('active', true)
        .where('visible', true)
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
                translationQuery
                  .whereRaw('unaccent(lower(name)) ILIKE unaccent(lower(?))', [`%${q}%`])
                  .andWhere('locale', locale)
              })
            })
            // OU recherche dans les sous-spécialités
            .orWhereHas('subSpecialities', (subSpecialityQuery) => {
              subSpecialityQuery.whereHas('translations', (translationQuery) => {
                translationQuery
                  .whereRaw('unaccent(lower(name)) ILIKE unaccent(lower(?))', [`%${q}%`])
                  .andWhere('locale', locale)
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
        'users.doctor_identifier',
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

  async getAvailableSlots({ params, request, response }: HttpContext) {
    const { id } = params
    const { date, duration = 15 } = request.qs() // durée en minutes

    // 1. Récupérer le médecin avec ses horaires
    const doctor = await User.query().preload('openingHours').where('id', id).firstOrFail()

    if (doctor.roleId !== 2 || doctor.active === false) {
      return response.unauthorized({ message: 'Unauthorized' })
    }
    const openingHours = doctor.openingHours

    // 2. Récupérer les événements du jour
    let startDate = DateTime.fromISO(date).startOf('day')
    const now = DateTime.now()
    if (startDate < now.startOf('day')) {
      startDate = now
    }
    const endDate = startDate.plus({ days: 7 }).endOf('day')

    const events = await Event.query()
      .where('practitionerId', id)
      .andWhere((query) => {
        // Événements non récurrents qui se trouvent dans la plage
        query
          .where('is_recurring', false)
          .andWhere('start', '<=', endDate.toJSDate())
          .andWhere('end', '>=', startDate.toJSDate())
          // OU événements récurrents
          .orWhere((subQuery) => {
            subQuery
              .where('is_recurring', true)
              .where('start_recur', '<=', endDate.toJSDate())
              .where('end_recur', '>=', startDate.toJSDate())
          })
      })

    // 3. Calculer les créneaux disponibles
    const slots = DateSlotService.calculateAvailableSlots({
      openingHours,
      events,
      date: startDate,
      slotDuration: duration,
      durationDays: 7,
    })

    return response.ok(slots)
  }

  async checkValidSelection({ params, request }: HttpContext) {
    const doctor = await User.query().preload('openingHours').where('id', params.id).firstOrFail()
    const { reasonId, slot } = request.qs() // durée en minutes

    console.log('reasonId', reasonId)
    console.log('slot', slot)

    if (!doctor || doctor.roleId !== 2 || doctor.active === false) {
      return { valid: false }
    }

    const reason = await Reason.query().where('id', reasonId).andWhere('userId', doctor.id).first()

    if (!reason) {
      return { valid: false }
    }
    const openingHours = doctor.openingHours
    const startDate = DateTime.fromISO(slot.replace(' ', '+')).startOf('day')
    const endDate = DateTime.fromISO(slot.replace(' ', '+')).endOf('day')

    console.log(startDate)
    console.log(endDate)

    const events = await Event.query()
      .where('practitionerId', doctor.id)
      .andWhere((query) => {
        // Événements non récurrents qui se trouvent dans la plage
        query
          .where('is_recurring', false)
          .andWhere('start', '<=', endDate.toJSDate())
          .andWhere('end', '>=', startDate.toJSDate())
          // OU événements récurrents
          .orWhere((subQuery) => {
            subQuery
              .where('is_recurring', true)
              .where('start_recur', '<=', endDate.toJSDate())
              .where('end_recur', '>=', startDate.toJSDate())
          })
      })

    const slots = DateSlotService.calculateAvailableSlots({
      openingHours,
      events,
      date: startDate,
      slotDuration: reason.duration,
      durationDays: 1,
    })

    return {
      valid: slots.filter((s) => s.start === slot.replace(' ', '+')).length === 1 ? true : false,
    }
  }

  async getCenters({ params }: HttpContext) {
    const centers = await Center.query().preload('centerUsers', (query) => {
      query.where('userId', params.id)
    })

    return centers
  }

  async getUsersAdmin({ request }: HttpContext) {
    const { role } = request.qs()

    const doctors = await User.query()
      .where('roleId', role)
      .preload('speciality', (query) => {
        query.preload('translations')
      })
      .preload('subSpecialitiesUsers', (query) => {
        query.preload('subSpeciality', (subQuery) => {
          subQuery.preload('translations')
        })
      })

    return doctors
  }

  async addUserAdmin({ request }: HttpContext) {
    let payload = await request.validateUsing(UserValidator.create)

    if (payload.coordinate) {
      const { x, y } = payload.coordinate
      // @ts-ignore - The point type expects a string in the format '(x,y)'
      payload.coordinate = `(${y},${x})`
    }
    const user = await User.create(payload)

    // send mail create account
    let mail_type: any = 'mail_create_account'
    if (payload.roleId === 2) {
      mail_type = 'mail_create_account_doctor'
    } else if (payload.roleId === 3) {
      mail_type = 'mail_create_account_secretary'
    } else {
      mail_type = 'mail_create_account'
    }

    await this.reminderService.scheduleReminderForEvent(
      user.id,
      '',
      0,
      user.email,
      DateTime.now().plus({ seconds: 10 }),
      mail_type,
      '',
      {
        userId: user.id,
      }
    )

    return user
  }

  async updateUserAdmin({ request }: HttpContext) {
    const { id } = request.params()
    let payload = await request.validateUsing(UserValidator.update)

    if (payload.coordinate) {
      const { x, y } = payload.coordinate
      // @ts-ignore - The point type expects a string in the format '(x,y)'
      payload.coordinate = `(${y},${x})`
    }
    const user = await User.query().where('id', id).update(payload).first()

    return user
  }
}
