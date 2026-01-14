import Events from '#models/events'
import User from '#models/user'
import { EventValidator } from '#validators/event'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

interface EventData {
  title: string
  description: string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  start?: Date
  end?: Date
  startRecur?: Date
  endRecur?: Date
  daysOfWeek?: number[]
  startTime?: string
  endTime?: string
  patientId?: string
  practitionerId?: string
}

export default class EventsController {
  async create({ auth, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User

    const data = (await request.validateUsing(EventValidator.create)) as EventData

    if (auth_user.roleId === 2) {
      const eventData: Partial<InstanceType<typeof Events>> = {
        ...data,
        practitionerId: auth_user.id,
        start: data.start ? DateTime.fromJSDate(data.start) : null,
        end: data.end ? DateTime.fromJSDate(data.end) : null,
        startRecur: data.startRecur ? DateTime.fromJSDate(data.startRecur) : null,
        endRecur: data.endRecur ? DateTime.fromJSDate(data.endRecur) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        daysOfWeek: data.daysOfWeek || null,
        allDay: data.allDay || false,
        backgroundColor: data.backgroundColor || 'hsl(var(--primary))',
        borderColor: data.borderColor || null,
      }

      const event = await Events.create(eventData)
      return event.toJSON()
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
      const events = await Events.query()
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
      const events = await Events.query().where('practitionerId', auth_user.id)
      return events
    }

    return response.unauthorized({ message: 'Unauthorized' })
  }

  async update({ auth, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const data = (await request.validateUsing(EventValidator.update)) as EventData
    const event = await Events.find(request.param('id'))
    if (event && event.practitionerId === auth_user.id) {
      event.merge({
        ...data,
        start: data.start ? DateTime.fromJSDate(data.start) : null,
        end: data.end ? DateTime.fromJSDate(data.end) : null,
        startRecur: data.startRecur ? DateTime.fromJSDate(data.startRecur) : null,
        endRecur: data.endRecur ? DateTime.fromJSDate(data.endRecur) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        daysOfWeek: data.daysOfWeek || null,
        allDay: data.allDay || false,
        backgroundColor: data.backgroundColor || 'hsl(var(--primary))',
        borderColor: data.borderColor || null,
      })
      await event.save()
      return event
    }
    return response.notFound({ message: 'Event not found' })
  }
}
