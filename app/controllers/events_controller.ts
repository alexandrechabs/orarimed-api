import { inject } from '@adonisjs/core'
import Contact from '#models/contacts'
import Event from '#models/events'
import Notification from '#models/notifications'
import Reason from '#models/reasons'
import User from '#models/user'
import DateSlotService from '#services/DateSlotService'
import ReminderService from '#services/reminderService'
import { EventValidator } from '#validators/event'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

interface EventData {
  title: string
  type: string
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
  status?: string
  patient: {
    id?: number
    firstname: string
    lastname: string
    phoneNumber: string
    email: string
  }
}

@inject()
export default class EventsController {
  constructor(private reminderService: ReminderService) {}

  async create({ auth, request, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User

    let type = request.input('type')
    let data
    if (type === 'appointment') {
      data = (await request.validateUsing(EventValidator.createEvent)) as EventData
    } else {
      data = (await request.validateUsing(EventValidator.createAbsence)) as EventData
    }

    if (auth_user.roleId === 1 || auth_user.id !== data.practitionerId) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    let contact

    if (type === 'appointment') {
      // si client id est fourni
      if (data.patient.id) {
        contact = await Contact.query()
          .where('id', data.patient.id)
          .andWhere('practitionerId', data.practitionerId)
          .first()
      } else {
        // si pas de client id fourni, recherche par numéro de téléphone
        contact = await Contact.query()
          .where('phoneNumber', data.patient.phoneNumber)
          .andWhere('practitionerId', data.practitionerId)
          .first()
      }
      // si contact non trouvé, créer un nouveau contact pour le médecin
      if (!contact) {
        // on regarde si on peut trouver le user pour le lier au contact
        let user = await User.query().where('phoneNumber', data.patient.phoneNumber).first()

        // on créé le contact
        contact = await Contact.create({
          patientId: user?.id,
          practitionerId: data.practitionerId,
          firstname: data.patient.firstname,
          lastname: data.patient.lastname,
          email: data.patient.email,
          phoneNumber: data.patient.phoneNumber,
          language: user ? user.language : auth_user.language,
        })
      }
    }

    if (auth_user.roleId === 2) {
      const eventData: Partial<InstanceType<typeof Event>> = {
        title: data.title,
        type: data.type,
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
        status: 'created',
      }

      const event = await Event.create(eventData)

      if (type === 'appointment' && contact) {
        // send mail and add notification via queue
        await this.reminderService.scheduleReminderForEvent(
          event.id + event.start!.toFormat('yyyy-MM-dd-HH-mm') + '',
          event.id,
          contact.id,
          contact.email!,
          DateTime.now().plus({ seconds: 10 }),
          'mail_appointment_confirmation',
          ''
        )

        if (event.start) {
          // set reminder
          await this.reminderService.scheduleReminderForEvent(
            event.id + event.start.toFormat('yyyy-MM-dd-HH-mm') + '-24h',
            event.id,
            contact.id,
            contact.email!,
            event.start,
            'mail_appointment_reminder',
            'day_before'
          )
        }
      }

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

    // call job to send appointment reminder with delay
    // await this.reminderService.scheduleReminderForEvent(
    //   'coucou1-24h',
    //   'f8bcb516-40ec-417c-bc06-0e99f35d0acd',
    //   4,
    //   'alexandrechabane72+3232@gmail.com',
    //   DateTime.now().plus({ minutes: 1 }).plus({ hours: 24 }),
    //   'mail_appointment_reminder'
    // )

    // await this.reminderService.cancelRemindersForEvent(event.id + event.start.toFormat('yyyy-MM-dd-HH-mm') + '-24h')

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
    const event = await Event.query().preload('patient').where('id', request.param('id')).first()

    if (event && event.practitionerId === auth_user.id) {
      // Si la date de l'événement change, supprimer les reminders existants
      const oldStart = event.start ? DateTime.fromJSDate(event.start as unknown as Date) : null
      const newStart = data.start ? DateTime.fromJSDate(data.start as unknown as Date) : null

      if (oldStart && newStart && !oldStart.hasSame(newStart, 'minute')) {
        // send mail change start date

        await this.reminderService.cancelRemindersForEvent(
          event.id + oldStart.toFormat('yyyy-MM-dd-HH-mm') + '-24h'
        )

        // add new reminder
        if (
          newStart &&
          data.status !== 'abortExcused' &&
          data.status !== 'abort' &&
          newStart > DateTime.now()
        ) {
          await this.reminderService.scheduleReminderForEvent(
            event.id + newStart.toFormat('yyyy-MM-dd-HH-mm') + '-24h',
            event.id,
            event.contactId!,
            event.patient!.email!,
            newStart,
            'mail_appointment_reminder',
            'day_before'
          )

          // send mail update
          await this.reminderService.scheduleReminderForEvent(
            event.id + newStart.toFormat('yyyy-MM-dd-HH-mm') + '-update',
            event.id,
            event.contactId!,
            event.patient!.email!,
            DateTime.now().plus({ seconds: 10 }),
            'mail_appointment_reschedule',
            '',
            {
              oldStart: oldStart,
            }
          )
        }
      }

      if (
        event.status !== data.status &&
        (data.status === 'abortExcused' || data.status === 'abort')
      ) {
        // annulation de remidner
        await this.reminderService.cancelRemindersForEvent(event.id + '-24h')
        console.log(`Cancelled reminders for event ${event.id} due to cancellation`)

        // send mail abort Rdv if event is in the past
        if (newStart && newStart > DateTime.now()) {
          // send mail for client

          await this.reminderService.scheduleReminderForEvent(
            event.id + newStart.toFormat('yyyy-MM-dd-HH-mm') + '-cancel',
            event.id,
            event.contactId!,
            event.patient!.email!,
            DateTime.now().plus({ seconds: 10 }),
            'mail_appointment_cancellation',
            ''
          )

          if (auth_user.id !== event.practitionerId) {
            // send mail to practitioner
            await this.reminderService.scheduleReminderForEvent(
              event.id + newStart.toFormat('yyyy-MM-dd-HH-mm') + '-cancel_doctor',
              event.id,
              event.contactId!,
              event.patient!.email!,
              DateTime.now().plus({ seconds: 10 }),
              'mail_appointment_cancellation_doctor',
              ''
            )
          }
        }
      }

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
        status: data.status || 'created',
        color: data.color || 'hsl(var(--primary))',
      })
      await event.save()

      return await Event.query()
        .where('id', request.param('id'))
        .preload('patient', (query) => {
          query.select(['id', 'firstname', 'lastname', 'email', 'phoneNumber'])
        })
        .first()
    }
    return response.notFound({ message: 'Event not found' })
  }

  async createRdv({ auth, params, request }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    let doctorId = params.id
    const data = await request.validateUsing(EventValidator.createRdv)

    const doctor = await User.query().preload('openingHours').where('id', params.id).firstOrFail()

    if (!doctor || doctor.roleId !== 2 || doctor.active === false) {
      return { valid: false }
    }

    const reason = await Reason.query()
      .where('id', data.reasonId)
      .andWhere('userId', doctor.id)
      .first()

    if (!reason) {
      return { valid: false }
    }

    // check if slot is already available
    const openingHours = doctor.openingHours
    const startDate = DateTime.fromISO(data.slot.replace(' ', '+')).startOf('day')
    const endDate = DateTime.fromISO(data.slot.replace(' ', '+')).endOf('day')

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

    if (slots.filter((s) => s.start === data.slot.replace(' ', '+')).length === 0) {
      return { valid: false, message: 'Slot not available' }
    }
    let contact

    // search contact
    contact = await Contact.query().where('patientId', auth_user.id).first()

    if (!contact) {
      contact = await Contact.create({
        patientId: auth_user.id,
        practitionerId: doctorId,
        firstname: auth_user.firstname,
        lastname: auth_user.lastname,
        email: auth_user.email,
        phoneNumber: auth_user.phoneNumber,
        language: auth_user.language,
      })
    }

    // create rdv
    let event = await Event.create({
      title: reason.name,
      type: 'appointment',
      contactId: contact.id,
      practitionerId: doctorId,
      description: '',
      notes: '',
      start: DateTime.fromISO(data.slot.replace(' ', '+')),
      end: DateTime.fromISO(data.slot.replace(' ', '+')).plus({ minutes: reason.duration }),
      allDay: false,
      color: reason.color,
      status: 'created',
    })

    await this.reminderService.scheduleReminderForEvent(
      event.id + event.start!.toFormat('yyyy-MM-dd-HH-mm') + '',
      event.id,
      contact.id,
      contact.email!,
      DateTime.now().plus({ seconds: 10 }),
      'mail_appointment_confirmation',
      ''
    )

    return {
      success: true,
    }
  }

  async getEventsContact({ auth, params, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    if (auth_user.roleId !== 2) {
      return response.unauthorized({ message: 'Unauthorized' })
    }
    const contact = await Contact.query()
      .where('id', params.id)
      .andWhere('practitionerId', auth_user.id)
      .first()
    if (!contact) {
      return response.notFound({ message: 'Contact not found' })
    }
    const events = await Event.query().where('contactId', contact.id)
    return events
  }

  async getNotifications({ auth, params, response }: HttpContext) {
    const auth_user = auth.user! as unknown as User
    const event = await Event.query().where('id', params.id).first()
    if (!event) {
      return { success: false, message: 'Event not found' }
    }

    // only admin or doctor who created the event can see notifications
    if (auth_user.roleId !== 4 && auth_user.id !== event.practitionerId) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const notifications = await Notification.query().where('eventId', event.id)
    return notifications
  }
}
