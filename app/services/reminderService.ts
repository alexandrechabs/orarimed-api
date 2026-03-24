import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import IORedis from 'ioredis'

@inject()
export default class ReminderService {
  async scheduleReminderForEvent(
    reminderId: string,
    eventId: string,
    contactId: number,
    contactEmail: string,
    eventStart: DateTime,
    reminderType:
      | 'mail_appointment_confirmation'
      | 'mail_appointment_reminder'
      | 'mail_appointment_cancellation'
      | 'mail_appointment_cancellation_doctor'
      | 'mail_appointment_reschedule'
      | 'mail_center_invitation'
      | 'mail_create_account'
      | 'mail_create_account_doctor'
      | 'mail_create_account_secretary'
      | 'mail_password_forgot',
    reminderDelay: string,
    extraData?: Record<string, any>
  ) {
    try {
      // Import dynamique pour éviter les erreurs de compilation
      const { default: SendAppointmentReminder } =
        await import('../jobs/send_appointment_reminder.js')

      let reminderTime = eventStart
      if (reminderType === 'mail_appointment_reminder') {
        if (reminderDelay === 'day_before') {
          // la veille à 18h
          reminderTime = eventStart.minus({ days: 1 }).set({ hour: 18, minute: 0, second: 0 })
        } else if (reminderDelay === 'hour_before') {
          reminderTime = eventStart.minus({ hours: 1 })
        }
      }
      const now = DateTime.now()

      if (reminderTime > now) {
        const delayInSeconds = reminderTime.diff(now, 'seconds').seconds
        await SendAppointmentReminder.dispatch(
          {
            reminderId: reminderId,
            eventId: eventId,
            contactId: contactId,
            contactEmail: contactEmail,
            createdAt: Date.now(),
            type: reminderType,
            extraData: extraData || {},
          },
          {
            delay: Math.floor(delayInSeconds * 1000), // Convertir en millisecondes
            attempts: 3,
          }
        )
        console.log(
          `Scheduled reminder for event ${eventId} in ${Math.floor(delayInSeconds)} seconds`
        )
      }
    } catch (error) {
      console.error('Error scheduling reminder:', error)
    }
  }

  async cancelRemindersForEvent(eventId: string) {
    try {
      // Utiliser Redis pour marquer les reminders comme annulés avec un timestamp
      const redis = new (IORedis as any)({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      })
      // Stocker le timestamp d'annulation (en millisecondes)
      const cancellationTime = Date.now().toString()
      await redis.set(`cancelled_reminders:${eventId}`, cancellationTime, 'EX', 86400) // 24h
      console.log(`Marked reminders as cancelled for event ${eventId} at ${cancellationTime}`)

      // Fermer la connexion
      await redis.quit()
    } catch (error) {
      console.error('Error cancelling reminders:', error)
    }
  }
}
