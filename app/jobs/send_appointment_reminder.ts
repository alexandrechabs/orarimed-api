import NotificationService from '#services/notification_service'
import { Job } from 'adonisjs-jobs'
import IORedis from 'ioredis'

type SendAppointmentReminderPayload = {
  reminderId: string
  eventId: string
  contactId: number
  contactEmail: string
  createdAt: number // Timestamp de création du job
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
    | 'mail_password_forgot'
    | 'mail_email_verification'
  extraData?: Record<string, any>
}

export default class SendAppointmentReminder extends Job {
  async handle(payload: SendAppointmentReminderPayload) {
    const notificationService = new NotificationService()
    // Vérifier si le reminder a été annulé
    const redis = new (IORedis as any)({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    })
    const cancellationTime = await redis.get(`cancelled_reminders:${payload.reminderId}`)

    if (cancellationTime && Number(cancellationTime) > payload.createdAt) {
      console.log(`Reminder cancelled for appointment ${payload.reminderId}`)
      await redis.del(`cancelled_reminders:${payload.reminderId}`)
      return
    }

    await notificationService.createNotification({
      eventId: payload.eventId,
      contactId: payload.contactId,
      type: payload.type,
      channel: 'email',
      recipient: payload.contactEmail,
      extraData: payload.extraData || {},
    })

    // Ici vous ajouteriez votre logique d'envoi de reminder
    // Par exemple: envoyer un email, un SMS, etc.
  }
}
