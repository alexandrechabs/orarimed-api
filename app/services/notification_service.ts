import { DateTime } from 'luxon'
import BrevoService from '#services/brevo_service'
import Notification from '#models/notifications'
import Contact from '#models/contacts'
import Event from '#models/events'

export default class NotificationService {
  private brevoService: BrevoService

  constructor(brevoService?: BrevoService) {
    this.brevoService = brevoService || new BrevoService()
  }

  async createNotification(data: {
    eventId: string
    contactId: number | null
    type:
      | 'mail_appointment_confirmation'
      | 'mail_appointment_reminder'
      | 'mail_appointment_cancellation'
      | 'mail_appointment_cancellation_doctor'
      | 'mail_appointment_reschedule'
      | 'mail_center_invitation'
    channel: 'email' | 'sms' | 'push'
    recipient: string
    extraData?: Record<string, any>
  }) {
    // Créer la notification en base
    const notification = await Notification.create({
      eventId: data.eventId,
      contactId: data.contactId,
      type: data.type,
      channel: data.channel,
      recipient: data.recipient,
      subject: '', // Sera géré par Brevo
      content: '', // Sera géré par Brevo
      status: 'pending',
    })

    // Envoyer l'email via Brevo si c'est un email
    if (data.channel === 'email' && data.contactId) {
      await this.sendEmailNotification(notification, data.type, data.extraData)
    }

    return notification
  }

  private async sendEmailNotification(notification: Notification, type: string, extraData?: any) {
    try {
      // Récupérer le contact et l'événement
      const contact = await Contact.find(notification.contactId)
      const event = await Event.query()
        .where('id', notification.eventId)
        .preload('practitioner', (query) => {
          query
            .select(['id', 'firstname', 'lastname', 'email', 'phoneNumber', 'address'])
            .preload('centerUsers', (centerUserQuery) => {
              centerUserQuery.preload('center', (centerQuery) => {
                centerQuery.select(['id', 'address', 'name'])
              })
            })
        })
        .first()

      if (!contact || !event) {
        await notification
          .merge({ status: 'failed', errorMessage: 'Contact or event not found' })
          .save()
        return
      }

      let result

      switch (type) {
        case 'mail_appointment_confirmation':
          result = await this.brevoService.sendAppointmentConfirmation(contact, {
            ...event.toJSON(),
          })
          break

        case 'mail_appointment_reminder':
          result = await this.brevoService.sendAppointmentReminder(contact, {
            ...event.toJSON(),
          })
          break

        case 'mail_appointment_cancellation':
          result = await this.brevoService.sendAppointmentCancellation(contact, {
            ...event.toJSON(),
          })
          break

        case 'mail_appointment_cancellation_doctor':
          result = await this.brevoService.sendAppointmentCancellationDoctor(contact, {
            ...event.toJSON(),
          })
          break

        case 'mail_appointment_reschedule':
          result = await this.brevoService.sendAppointmentReschedule(
            contact,
            {
              ...event.toJSON(),
            },
            extraData!.oldStart
          )
          break

        case 'mail_center_invitation':
          result = await this.brevoService.sendCenterInvitation(contact, {
            name: 'Centre Médical',
            address: 'Adresse du centre',
            invitationCode: 'CODE123',
          })
          break

        default:
          throw new Error(`Unknown notification type: ${type}`)
      }

      // Mettre à jour le statut de la notification
      if (result.success) {
        await notification
          .merge({
            status: 'sent',
            sentAt: DateTime.now(),
          })
          .save()
      } else {
        await notification
          .merge({
            status: 'failed',
            errorMessage: result.error,
          })
          .save()
      }
    } catch (error) {
      console.error('Error sending email notification:', error)
      await notification
        .merge({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .save()
    }
  }

  async getNotifications(eventId: string) {
    return await Notification.query().where('eventId', eventId)
  }

  async resendNotification(notificationId: number) {
    const notification = await Notification.find(notificationId)
    if (!notification) {
      throw new Error('Notification not found')
    }

    // Remettre le statut à pending et renvoyer
    await notification.merge({ status: 'pending' }).save()
    await this.sendEmailNotification(notification, notification.type)

    return notification
  }
}
