import Contact from '#models/contacts'
import Event from '#models/events'
import User from '#models/user'
import { EventValidator } from '#validators/event'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

interface EventData {
  title: string
  description?: string
  allDay?: boolean
  color?: string
  start?: Date
  end?: Date
  startRecur?: Date
  endRecur?: Date
  daysOfWeek?: number[]
  startTime?: string
  endTime?: string
  practitionerId: string
  contactId?: number
  notes?: string
  patient: {
    id?: number
    firstname: string
    lastname: string
    phoneNumber: string
    email: string
  }
}

export default class EventsController {
  async create({ auth, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User

    const data = (await request.validateUsing(EventValidator.create)) as EventData

    let contact
    if (!data.patient.id) {
      // create contact and check if user exist
      contact = await Contact.query()
        .where('phoneNumber', data.patient.phoneNumber)
        .andWhere('practitionerId', data.practitionerId)
        .first()
      console.log(contact)
      if (!contact) {
        let user = await User.query().where('phoneNumber', data.patient.phoneNumber).first()
        console.log(user)

        // create contact
        contact = await Contact.create({
          patientId: user?.id,
          practitionerId: data.practitionerId,
          firstname: data.patient.firstname,
          lastname: data.patient.lastname,
          email: data.patient.email,
          phoneNumber: data.patient.phoneNumber,
        })
        console.log(contact)
      }
    }
    if (auth_user.roleId === 2) {
      console.log(data)

      const eventData: Partial<InstanceType<typeof Event>> = {
        title: data.title,
        contactId: contact?.id,
        practitionerId: auth_user.id,
        description: data.description,
        notes: data?.notes,
        start: data.start ? DateTime.fromJSDate(data.start) : null,
        end: data.end ? DateTime.fromJSDate(data.end) : null,
        startRecur: data.startRecur ? DateTime.fromJSDate(data.startRecur) : null,
        endRecur: data.endRecur ? DateTime.fromJSDate(data.endRecur) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        daysOfWeek: data.daysOfWeek || null,
        allDay: data.allDay || false,
        color: data.color || 'hsl(var(--primary))',
      }

      const event = await Event.create(eventData)

      return await Event.query()
        .where('id', event.id)
        .preload('patient', (query) => {
          query.select(['id', 'firstname', 'lastname', 'email', 'phoneNumber'])
        })
        .first()
    }

    return response.unauthorized({ message: 'Unauthorized' })
  }

  async index({ auth, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    let start = request.input('start')
    let end = request.input('end')

    if (start && end) {
      const startDate = DateTime.fromISO(start)
      const endDate = DateTime.fromISO(end)
      // retourne les events entre start et end

      const events = await Event.query()
        .preload('patient', (query) => {
          query.select(['id', 'firstname', 'lastname', 'email', 'phoneNumber'])
        })
        .where('practitionerId', auth_user.id)
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
      return events
    }

    if (auth_user.roleId === 2) {
      const events = await Event.query().where('practitionerId', auth_user.id)
      return events
    }

    return response.unauthorized({ message: 'Unauthorized' })
  }

  async update({ auth, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const data = (await request.validateUsing(EventValidator.update)) as EventData
    const event = await Event.find(request.param('id'))
    if (event && event.practitionerId === auth_user.id) {
      event.merge({
        title: data.title,
        contactId: data.contactId,
        practitionerId: auth_user.id,
        description: data.description,
        notes: data?.notes,
        start: data.start ? DateTime.fromJSDate(data.start) : null,
        end: data.end ? DateTime.fromJSDate(data.end) : null,
        startRecur: data.startRecur ? DateTime.fromJSDate(data.startRecur) : null,
        endRecur: data.endRecur ? DateTime.fromJSDate(data.endRecur) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        daysOfWeek: data.daysOfWeek || null,
        allDay: data.allDay || false,
        color: data.color || 'hsl(var(--primary))',
      })
      await event.save()
      return event
    }
    return response.notFound({ message: 'Event not found' })
  }
}
