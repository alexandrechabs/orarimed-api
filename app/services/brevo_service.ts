import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import Contact from '#models/contacts'
import { format } from 'date-fns'
import { fr, enUS, sq } from 'date-fns/locale'

export interface BrevoTemplateData {
  to: { email: string; name: string }[]
  templateId: number
  params?: Record<string, any>
  language?: string
}

@inject()
export default class BrevoService {
  private apiKey: string
  private baseUrl = 'https://api.brevo.com/v3'

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || ''
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Brevo API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  returnLocale(language: string) {
    switch (language) {
      case 'fr':
        return fr
      case 'en':
        return enUS
      case 'sq':
        return sq
      default:
        return sq
    }
  }

  async sendTransactionalEmail(data: BrevoTemplateData) {
    try {
      const payload = {
        to: data.to,
        templateId: data.templateId,
        params: data.params || {},
        language: data.language || 'fr',
      }

      const result = (await this.makeRequest('/smtp/email', {
        method: 'POST',
        body: JSON.stringify(payload),
      })) as any

      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Brevo email error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async sendAppointmentConfirmation(contact: Contact, eventData: any) {
    const language = contact.language || 'sq'

    // Templates Brevo à créer dans l'interface Brevo
    const templateIds = {
      fr: 3, // Template ID pour le français
      en: 4, // Template ID pour l'anglais
      sq: 5, // Template ID pour l'albanais
    }

    const templateId = templateIds[language as keyof typeof templateIds] || templateIds.sq
    let address = eventData.practitioner.address

    if (eventData.practitioner.centerUsers && eventData.practitioner.centerUsers.length > 0) {
      address = eventData.practitioner.centerUsers[0].center.address
    }

    return this.sendTransactionalEmail({
      to: [{ email: contact.email!, name: `${contact.firstname} ${contact.lastname}` }],
      templateId,
      params: {
        firstname: contact.firstname,
        lastname: contact.lastname,
        address: address,
        center: eventData.practitioner.centerUsers?.[0]?.center?.name || '',
        date: format(eventData.start, 'PPPP', {
          locale: this.returnLocale(language),
        }),
        time: format(eventData.start, 'p', {
          locale: this.returnLocale(language),
        }),
        title_time: format(eventData.start, 'PPPPp', {
          locale: this.returnLocale(language),
        }),
        doctor_firstname: eventData.practitioner.firstname,
        doctor_lastname: eventData.practitioner.lastname,
        title: eventData.title,
      },
      language,
    })
  }

  async sendAppointmentReminder(contact: Contact, eventData: any) {
    const language = contact.language || 'sq'

    const templateIds = {
      fr: 6, // Template ID pour le rappel en français
      en: 7, // Template ID pour le rappel en anglais
      sq: 8, // Template ID pour le rappel en albanais
    }

    const templateId = templateIds[language as keyof typeof templateIds] || templateIds.fr
    let address = eventData.practitioner.address

    if (eventData.practitioner.centerUsers && eventData.practitioner.centerUsers.length > 0) {
      address = eventData.practitioner.centerUsers[0].center.address
    }

    return this.sendTransactionalEmail({
      to: [{ email: contact.email!, name: `${contact.firstname} ${contact.lastname}` }],
      templateId,
      params: {
        firstname: contact.firstname,
        lastname: contact.lastname,
        address: address,
        center: eventData.practitioner.centerUsers?.[0]?.center?.name || '',
        date: format(eventData.start, 'PPPP', {
          locale: this.returnLocale(language),
        }),
        time: format(eventData.start, 'p', {
          locale: this.returnLocale(language),
        }),
        title_time: format(eventData.start, 'PPPPp', {
          locale: this.returnLocale(language),
        }),
        doctor_firstname: eventData.practitioner.firstname,
        doctor_lastname: eventData.practitioner.lastname,
        title: eventData.title,
      },
      language,
    })
  }

  async sendAppointmentCancellation(contact: Contact, eventData: any) {
    const language = contact.language || 'sq'

    const templateIds = {
      fr: 10, // Template ID pour l'annulation en français
      en: 11, // Template ID pour l'annulation en anglais
      sq: 12, // Template ID pour l'annulation en albanais
    }

    const templateId = templateIds[language as keyof typeof templateIds] || templateIds.fr
    let address = eventData.practitioner.address

    if (eventData.practitioner.centerUsers && eventData.practitioner.centerUsers.length > 0) {
      address = eventData.practitioner.centerUsers[0].center.address
    }

    return this.sendTransactionalEmail({
      to: [{ email: contact.email!, name: `${contact.firstname} ${contact.lastname}` }],
      templateId,
      params: {
        firstname: contact.firstname,
        lastname: contact.lastname,
        address: address,
        center: eventData.practitioner.centerUsers?.[0]?.center?.name || '',
        date: format(eventData.start, 'PPPP', {
          locale: this.returnLocale(language),
        }),
        time: format(eventData.start, 'p', {
          locale: this.returnLocale(language),
        }),
        title_time: format(eventData.start, 'PPPPp', {
          locale: this.returnLocale(language),
        }),
        doctor_firstname: eventData.practitioner.firstname,
        doctor_lastname: eventData.practitioner.lastname,
        title: eventData.title,
      },
      language,
    })
  }

  async sendAppointmentCancellationDoctor(contact: Contact, eventData: any) {
    const language = contact.language || 'sq'

    const templateIds = {
      fr: 16, // Template ID pour l'annulation en français
      en: 17, // Template ID pour l'annulation en anglais
      sq: 18, // Template ID pour l'annulation en albanais
    }

    const templateId = templateIds[language as keyof typeof templateIds] || templateIds.fr
    let address = eventData.practitioner.address

    if (eventData.practitioner.centerUsers && eventData.practitioner.centerUsers.length > 0) {
      address = eventData.practitioner.centerUsers[0].center.address
    }

    return this.sendTransactionalEmail({
      to: [{ email: contact.email!, name: `${contact.firstname} ${contact.lastname}` }],
      templateId,
      params: {
        firstname: contact.firstname,
        lastname: contact.lastname,
        address: address,
        center: eventData.practitioner.centerUsers?.[0]?.center?.name || '',
        date: format(eventData.start, 'PPPP', {
          locale: this.returnLocale(language),
        }),
        time: format(eventData.start, 'p', {
          locale: this.returnLocale(language),
        }),
        title_time: format(eventData.start, 'PPPPp', {
          locale: this.returnLocale(language),
        }),
        doctor_firstname: eventData.practitioner.firstname,
        doctor_lastname: eventData.practitioner.lastname,
        title: eventData.title,
      },
      language,
    })
  }

  async sendAppointmentReschedule(contact: Contact, eventData: any, oldDate: any) {
    const language = contact.language || 'sq'

    const templateIds = {
      fr: 19, // Template ID pour le report en français
      en: 20, // Template ID pour le report en anglais
      sq: 21, // Template ID pour le report en albanais
    }

    const templateId = templateIds[language as keyof typeof templateIds] || templateIds.fr
    let address = eventData.practitioner.address

    if (eventData.practitioner.centerUsers && eventData.practitioner.centerUsers.length > 0) {
      address = eventData.practitioner.centerUsers[0].center.address
    }

    return this.sendTransactionalEmail({
      to: [{ email: contact.email!, name: `${contact.firstname} ${contact.lastname}` }],
      templateId,
      params: {
        firstname: contact.firstname,
        lastname: contact.lastname,
        address: address,
        center: eventData.practitioner.centerUsers?.[0]?.center?.name || '',
        new_date: format(eventData.start, 'PPPP', {
          locale: this.returnLocale(language),
        }),
        new_time: format(eventData.start, 'p', {
          locale: this.returnLocale(language),
        }),
        old_date: oldDate
          ? format(oldDate, 'PPPP', {
              locale: this.returnLocale(language),
            })
          : '',
        old_time: oldDate
          ? format(oldDate, 'p', {
              locale: this.returnLocale(language),
            })
          : '',
        title_time: format(eventData.start, 'PPPPp', {
          locale: this.returnLocale(language),
        }),
        doctor_firstname: eventData.practitioner.firstname,
        doctor_lastname: eventData.practitioner.lastname,
        title: eventData.title,
      },
      language,
    })
  }

  async sendCenterInvitation(contact: Contact, centerData: any) {
    const language = contact.language || 'sq'

    const templateIds = {
      fr: 13, // Template ID pour l'invitation en français
      en: 14, // Template ID pour l'invitation en anglais
      sq: 15, // Template ID pour l'invitation en albanais
    }

    const templateId = templateIds[language as keyof typeof templateIds] || templateIds.fr

    return this.sendTransactionalEmail({
      to: [{ email: contact.email!, name: `${contact.firstname} ${contact.lastname}` }],
      templateId,
      params: {
        FIRSTNAME: contact.firstname,
        LASTNAME: contact.lastname,
        CENTER_NAME: centerData.name,
        CENTER_ADDRESS: centerData.address,
        INVITATION_CODE: centerData.invitationCode,
      },
      language,
    })
  }
}
