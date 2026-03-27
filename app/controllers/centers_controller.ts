import User from '#models/user'
import Center from '#models/centers'
import type { HttpContext } from '@adonisjs/core/http'
import { CenterValidator } from '#validators/center'
import { validate as isUuid } from 'uuid'
import { OpeningHourValidator } from '#validators/opening_hour'
import OpeningHour from '#models/opening_hour'
import CenterUser from '#models/centers_users'
import R2Service from '#services/R2Service'
import app from '@adonisjs/core/services/app'
import sharp from 'sharp'
import * as fs from 'node:fs/promises'
import { cuid } from '@adonisjs/core/helpers'
import { Readable } from 'node:stream'

export default class CentersController {
  async addCenter({ auth, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    if (auth_user.roleId !== 2 && auth_user.roleId !== 4) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    let payload = await request.validateUsing(CenterValidator.createCenter)

    const center = await Center.create({
      name: payload.name,
      description: payload.description,
      address: payload.address,
      city: payload.city,
      country: payload.country,
      phoneNumber: payload.phoneNumber,
      email: payload.email,
      website: payload.website,
      visible: payload.visible,
      active: payload.active,
      specialityId: payload.specialityId,
      coordinate: payload.coordinate ? `(${payload.coordinate.x},${payload.coordinate.y})` : null,
    })

    return center
  }

  async getCenter({ params }: HttpContext) {
    let query = Center.query().preload('speciality', (query) => {
      query.preload('translations')
    })

    if (isUuid(params.id)) {
      query = query
        .where('id', params.id)
        .preload('openingHours')
        .preload('centerUsers', (query) => {
          query.preload('user', (userQuery) => {
            userQuery.preload('speciality', (specialityQuery) => {
              specialityQuery.preload('translations')
            })
          })
        })
    } else {
      query = query
        .where('center_identifier', params.id)
        .preload('openingHours')
        .preload('centerUsers', (query) => {
          query.preload('user', (userQuery) => {
            userQuery.preload('speciality', (specialityQuery) => {
              specialityQuery.preload('translations')
            })
          })
        })
    }

    let center = await query.firstOrFail()
    return center
  }

  async getCenters({ auth, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User

    if (auth_user.roleId !== 2 && auth_user.roleId !== 4) {
      return response.unauthorized({ message: 'Unauthorized' })
    }
    if (auth_user.roleId === 4) {
      return Center.query()
        .preload('speciality', (query) => {
          query.preload('translations')
        })
        .preload('centerUsers', (query) => {
          query.preload('user', (query) => {
            query.select(['id', 'firstname', 'lastname', 'avatar'])
          })
        })
    } else {
      return Center.query()
        .preload('speciality', (query) => {
          query.preload('translations')
        })
        .preload('centerUsers', (query) => {
          query.preload('user', (query) => {
            query.select(['id', 'firstname', 'lastname', 'email', 'avatar'])
          })
        })
    }
  }

  async updateCenter({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    if (auth_user.roleId !== 2) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const center = await Center.query().where('id', params.id).firstOrFail()
    let payload = await request.validateUsing(CenterValidator.updateCenter)
    if (payload.coordinate) {
      const { x, y } = payload.coordinate
      // @ts-ignore - The point type expects a string in the format '(x,y)'
      payload.coordinate = `(${y},${x})`
    }
    center.merge(payload)
    await center.save()

    return center
  }

  async getOpeningHours({ params }: HttpContext) {
    const center = await Center.findOrFail(params.id)

    let opening_hours = await OpeningHour.query().where('centerId', center.id)

    return opening_hours
  }

  async addOpeningHour({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const center = await Center.query().preload('centerUsers').where('id', params.id).first()

    if (!center) {
      return response.notFound({ error: 'Center not found' })
    }

    if (
      !auth_user ||
      auth_user.roleId === 1 ||
      (auth_user.roleId !== 2 && auth_user.roleId !== 4) ||
      (auth_user.roleId === 2 &&
        !center?.centerUsers
          .filter((c) => c.isAdmin === true)
          .some((centerUser) => centerUser.userId === auth_user.id))
    ) {
      return response.notFound({ error: 'User not found' })
    }

    const data = await request.validateUsing(OpeningHourValidator.create)

    // on récupère les heures d'ouverture en base de données
    const openingHours = await OpeningHour.query().where('centerId', center.id)

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
          centerId: center.id,
          dayOfWeek: openingHour.dayOfWeek,
          period: openingHour.period,
          openTime: openingHour.openTime,
          closeTime: openingHour.closeTime,
          timeZone: openingHour.timeZone,
        })
      }
    }

    return await OpeningHour.query().where('centerId', center.id)
  }

  async getDoctors({ params }: HttpContext) {
    const users = await CenterUser.query()
      .where('centerId', params.id)
      .preload('user', (query) => {
        query
          .preload('speciality', (query) => {
            query.preload('translations')
          })
          .select(
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
            'address'
          )
      })

    return users.map((cu) => {
      const user = cu.user

      return {
        ...user.serialize(), // important avec Lucid
        isAdmin: cu.isAdmin,
      }
    })
  }

  async addDoctors({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const center = await Center.query().where('id', params.id).preload('centerUsers').firstOrFail()

    let currentUserIsAdmin =
      center.centerUsers.filter((cu) => cu.userId === auth_user.id && cu.isAdmin).length > 0

    // get list of usersIds
    let userIds: string[] = []
    center.centerUsers.forEach((cu) => {
      userIds.push(cu.userId)
    })

    if (
      !auth_user ||
      auth_user.roleId === 1 ||
      (auth_user.roleId === 2 && !currentUserIsAdmin) ||
      (auth_user.roleId !== 2 && auth_user.roleId !== 4)
    ) {
      return response.notFound({ error: 'User not found' })
    }

    const data = await request.validateUsing(CenterValidator.addUsers)

    // delete centerUsers in userIds and not in data.doctorIds
    for (const userId of userIds) {
      if (!data.doctors.map((d) => d.doctorId).includes(userId)) {
        await CenterUser.query().where('centerId', center.id).where('userId', userId).delete()
      }
    }

    // add centerUsers in data.doctorIds and not in userIds
    for (const userId of data.doctors) {
      if (!userIds.includes(userId.doctorId)) {
        await CenterUser.create({
          centerId: center.id,
          userId: userId.doctorId,
          isAdmin: userId.isAdmin,
        })
      }
    }

    const users = await CenterUser.query()
      .where('centerId', params.id)
      .preload('user', (query) => {
        query
          .preload('speciality', (query) => {
            query.preload('translations')
          })
          .select(
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
            'address'
          )
      })

    return users.map((cu) => {
      const user = cu.user

      return {
        ...user.serialize(), // important avec Lucid
        isAdmin: cu.isAdmin,
      }
    })
  }

  public async upload({ auth, params, request, response }: HttpContext) {
    const auth_user = auth.user! as User
    const center = await Center.query().where('id', params.id).preload('centerUsers').firstOrFail()

    let currentUserIsAdmin =
      center.centerUsers.filter((cu) => cu.userId === auth_user.id && cu.isAdmin).length > 0

    // get list of usersIds
    let userIds: string[] = []
    center.centerUsers.forEach((cu) => {
      userIds.push(cu.userId)
    })

    // Check if user exists and if the user is the same as the authenticated user for doctor (roleId = 2) or if user is admin (roleId = 4)
    if (
      !auth_user ||
      auth_user.roleId === 1 ||
      (auth_user.roleId === 2 && !currentUserIsAdmin) ||
      (auth_user.roleId !== 2 && auth_user.roleId !== 4)
    ) {
      return response.notFound({ error: 'User not found' })
    }

    const r2Service = new R2Service()

    if (center.avatar) {
      await r2Service.deleteFile(`center/${center.avatar}.webp`)
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

      const filename = `center/${baseName}.webp`

      await r2Service.uploadFile(filename, buffer, 'image/webp')

      await center.merge({ avatar: baseName }).save()

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
    const center = await Center.find(params.id)

    if (!center || !center.avatar) {
      return response.notFound({ error: 'Center not found' })
    }

    const r2Service = new R2Service()
    const object = await r2Service.getImage(`center/${center.avatar}.webp`)

    // Headers importants
    response.header('Content-Type', object.ContentType || 'application/octet-stream')
    response.header('Content-Length', object.ContentLength?.toString() || '')
    response.header('Cache-Control', 'private, max-age=3600')

    return response.stream(object.Body as Readable)
  }
}
