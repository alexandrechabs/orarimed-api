import { DateTime } from 'luxon'
import BrevoService from '#services/brevo_service'
import Notification from '#models/notifications'
import Contact from '#models/contacts'
import Event from '#models/events'
import User from '#models/user'

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
      | 'mail_create_account'
      | 'mail_create_account_doctor'
      | 'mail_create_account_secretary'
      | 'mail_password_reset'
      | 'mail_email_verification'
      | 'mail_contact_form'

    channel: 'email' | 'sms' | 'push'
    recipient: string
    extraData?: Record<string, any>
  }) {
    // Créer la notification en base
    let notifCreate = true
    if (data.eventId === '') {
      notifCreate = false
    }
    let notification
    if (notifCreate) {
      notification = await Notification.create({
        eventId: data.eventId,
        contactId: data.contactId,
        type: data.type,
        channel: data.channel,
        recipient: data.recipient,
        subject: '', // Sera géré par Brevo
        content: '', // Sera géré par Brevo
        status: 'pending',
      })
    } else {
      notification = {
        id: 0,
        eventId: '',
        contactId: data.contactId,
        type: data.type,
        channel: data.channel,
        content: '', // Sera géré par Brevo
        status: 'pending',
        errorMessage: null,
        sentAt: null,
        deliveredAt: null,
      }
    }

    // Envoyer l'email via Brevo si c'est un email
    if (data.channel === 'email') {
      await this.sendEmailNotification(notification, data.type, notifCreate, data.extraData)
    }

    return notification
  }

  private async sendEmailNotification(
    notification: any,
    type: string,
    notifCreate: boolean,
    extraData?: any
  ) {
    try {
      // Récupérer le contact et l'événement
      let contact
      if (notification.contactId !== '0') {
        contact = await Contact.find(notification.contactId)
      }
      let event
      if (notification.eventId !== '') {
        event = await Event.query()
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
      }

      let user
      if (extraData.userId) {
        user = await User.find(extraData.userId)
      }

      if (notifCreate && (!contact || !event)) {
        await notification
          .merge({ status: 'failed', errorMessage: 'Contact or event not found' })
          .save()
        return
      }

      let result

      switch (type) {
        case 'mail_appointment_confirmation':
          result = await this.brevoService.sendAppointmentConfirmation(contact!, {
            ...event!.toJSON(),
          })
          break

        case 'mail_appointment_reminder':
          result = await this.brevoService.sendAppointmentReminder(contact!, {
            ...event!.toJSON(),
          })
          break

        case 'mail_appointment_cancellation':
          result = await this.brevoService.sendAppointmentCancellation(contact!, {
            ...event!.toJSON(),
          })
          break

        case 'mail_appointment_cancellation_doctor':
          result = await this.brevoService.sendAppointmentCancellationDoctor(contact!, {
            ...event!.toJSON(),
          })
          break

        case 'mail_appointment_reschedule':
          result = await this.brevoService.sendAppointmentReschedule(
            contact!,
            {
              ...event!.toJSON(),
            },
            extraData!.oldStart
          )
          break

        case 'mail_center_invitation':
          result = await this.brevoService.sendCenterInvitation(contact!, {
            name: 'Centre Médical',
            address: 'Adresse du centre',
            invitationCode: 'CODE123',
          })
          break

        case 'mail_create_account':
          if (user) {
            result = await this.brevoService.sendNewAccount(user)
          }
          break

        case 'mail_create_account_doctor':
          if (user) {
            result = await this.brevoService.sendNewAccountDoctor(user, extraData!.resetToken)
          }
          break
        case 'mail_create_account_secretary':
          if (user) {
            result = await this.brevoService.sendNewAccountSecretary(user, extraData!.resetToken)
          }
          break
        case 'mail_email_verification':
          if (user) {
            result = await this.brevoService.sendEmailVerification(user)
          }
          break
        case 'mail_password_reset':
          if (user) {
            result = await this.brevoService.sendResetPassword(user, extraData!.resetToken)
          }
          break
        case 'mail_contact_form':
          if (extraData) {
            result = await this.brevoService.sendContactForm(extraData)
          }
          break
        default:
          throw new Error(`Unknown notification type: ${type}`)
      }

      // Mettre à jour le statut de la notification
      if (notifCreate) {
        if (result && result.success) {
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
              errorMessage: result?.error || 'Unknown error',
            })
            .save()
        }
      }
    } catch (error) {
      console.error('Error sending email notification:', error)
      if (notifCreate) {
        await notification
          .merge({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
          .save()
      }
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
    await this.sendEmailNotification(notification, notification.type, true)

    return notification
  }
}
