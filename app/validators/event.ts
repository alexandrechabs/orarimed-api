import vine from '@vinejs/vine'

// Fonction pour valider les heures (HH:mm)
const timeFormat = vine.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)

// Fonction pour valider les dates
function validateDate(value: unknown) {
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const date = new Date(value)
    if (!isNaN(date.getTime())) return date
  }
  throw new Error('The field must be a valid date or ISO date string')
}

export const EventValidator = {
  create: vine.compile(
    vine.object({
      title: vine.string(),
      patientId: vine.string().optional(),
      practitionerId: vine.string().optional(),
      description: vine.string(),
      // Accepter les chaînes ISO ou les objets Date
      start: vine
        .any()
        .transform((value) => {
          try {
            return validateDate(value)
          } catch {
            throw new Error('The start field must be a valid date or ISO date string')
          }
        })
        .optional(),
      end: vine
        .any()
        .transform((value) => {
          try {
            return validateDate(value)
          } catch {
            throw new Error('The end field must be a valid date or ISO date string')
          }
        })
        .optional(),
      allDay: vine.boolean().optional(),
      backgroundColor: vine.string().optional(),
      borderColor: vine.string().optional(),
      startRecur: vine
        .any()
        .optional()
        .transform((value) => {
          if (!value) return null
          try {
            return validateDate(value)
          } catch {
            throw new Error('The startRecur field must be a valid date or ISO date string')
          }
        }),
      endRecur: vine
        .any()
        .optional()
        .transform((value) => {
          if (!value) return null
          try {
            return validateDate(value)
          } catch {
            throw new Error('The endRecur field must be a valid date or ISO date string')
          }
        }),
      daysOfWeek: vine.array(vine.number().min(0).max(6)).optional(),
      startTime: timeFormat.optional(),
      endTime: timeFormat.optional(),
    })
  ),
  update: vine.compile(
    vine.object({
      title: vine.string(),
      id: vine.string(),
      patientId: vine.string().optional(),
      practitionerId: vine.string().optional(),
      description: vine.string(),
      // Accepter les chaînes ISO ou les objets Date
      start: vine
        .any()
        .transform((value) => {
          try {
            return validateDate(value)
          } catch {
            throw new Error('The start field must be a valid date or ISO date string')
          }
        })
        .optional(),
      end: vine
        .any()
        .transform((value) => {
          try {
            return validateDate(value)
          } catch {
            throw new Error('The end field must be a valid date or ISO date string')
          }
        })
        .optional(),
      allDay: vine.boolean().optional(),
      backgroundColor: vine.string().optional(),
      borderColor: vine.string().optional(),
      startRecur: vine
        .any()
        .optional()
        .transform((value) => {
          if (!value) return null
          try {
            return validateDate(value)
          } catch {
            throw new Error('The startRecur field must be a valid date or ISO date string')
          }
        }),
      endRecur: vine
        .any()
        .optional()
        .transform((value) => {
          if (!value) return null
          try {
            return validateDate(value)
          } catch {
            throw new Error('The endRecur field must be a valid date or ISO date string')
          }
        }),
      daysOfWeek: vine.array(vine.number().min(0).max(6)).optional(),
      startTime: timeFormat.optional(),
      endTime: timeFormat.optional(),
    })
  ),
}
