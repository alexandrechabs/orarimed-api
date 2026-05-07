import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ReminderService from '#services/reminderService'
import { DateTime } from 'luxon'

@inject()
export default class OtherController {
    constructor(private reminderService: ReminderService) { }

    async form({ request, response }: HttpContext) {
        const { name, phone, email, message } = request.only(['name', 'phone', 'email', 'message'])

        // send mail
        await this.reminderService.scheduleReminderForEvent(
            'form',
            '',
            0,
            '',
            DateTime.now().plus({ seconds: 10 }),
            'mail_contact_form',
            '',
            {
                name: name,
                phone: phone,
                email: email,
                message: message,
            }
        )

        return response.ok({
            message: 'Form submitted successfully',
        })
    }
}