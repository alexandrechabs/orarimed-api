// app/services/DateSlotService.ts
import { DateTime } from 'luxon'
// ... autres imports nécessaires

export default class DateSlotService {
  public static calculateAvailableSlots({
    openingHours,
    events,
    date,
    slotDuration,
    durationDays,
  }: {
    openingHours: any
    events: any[]
    date: DateTime
    slotDuration: number
    durationDays: number
  }) {
    const slots = []
    const now = DateTime.now()

    // Boucler sur les 7 prochains jours
    for (let day = 0; day < durationDays; day++) {
      const currentDate = date.plus({ days: day })
      const dayOfWeek = currentDate.weekday // 1 (lundi) à 7 (dimanche)
      const dayOpeningHours = openingHours.filter(
        (openingHour: any) => openingHour.dayOfWeek === dayOfWeek
      )

      if (!dayOpeningHours || !dayOpeningHours.length) {
        continue // Passe au jour suivant si pas d'heures d'ouverture
      }
      const isToday = currentDate.hasSame(now, 'day')

      // Pour chaque plage d'ouverture de la journée
      for (const range of dayOpeningHours) {
        let [startHours, startMinutes] = range.openTime.split(':').map(Number)
        const [endHours, endMinutes] = range.closeTime.split(':').map(Number)

        if (isToday) {
          const currentHour = now.hour
          const currentMinute = now.minute

          // Si l'heure de début est passée, commencer au prochain créneau
          if (
            startHours < currentHour ||
            (startHours === currentHour && startMinutes < currentMinute)
          ) {
            startMinutes = Math.ceil((currentMinute + 1) / 15) * 15 // Arrondir au quart d'heure supérieur

            if (startMinutes >= 60) {
              startHours += Math.floor(startMinutes / 60)
              startMinutes = startMinutes % 60
            }
            startHours += currentHour - startHours

            // Si on dépasse l'heure de fermeture, passer au jour suivant

            if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
              continue
            }
          }
        }

        let currentSlot = currentDate.setZone(range.timeZone).set({
          hour: startHours,
          minute: startMinutes,
          second: 0,
          millisecond: 0,
        })

        const endTime = currentDate.setZone(range.timeZone).set({
          hour: endHours,
          minute: endMinutes,
          second: 0,
          millisecond: 0,
        })

        // Vérifier chaque créneau de la durée spécifiée
        while (currentSlot.plus({ minutes: slotDuration }) <= endTime) {
          const slotEnd = currentSlot.plus({ minutes: slotDuration })
          let isAvailable = true

          // Vérifier les conflits avec les événements
          for (const event of events) {
            if (event.start && event.end) {
              const eventStart = event.start
              const eventEnd = event.end

              if (
                DateSlotService.isSlotOverlapping(
                  { start: currentSlot, end: slotEnd },
                  { start: eventStart, end: eventEnd }
                )
              ) {
                isAvailable = false
                break
              }
            }
          }

          if (isAvailable) {
            slots.push({
              start: currentSlot.toISO(),
              end: slotEnd.toISO(),
            })
          }

          currentSlot = currentSlot.plus({ minutes: 15 }) // Pas de 15 minutes entre les créneaux
        }
      }
    }

    return slots
  }

  public static isSlotOverlapping(
    slot1: { start: DateTime; end: DateTime },
    slot2: { start: DateTime; end: DateTime }
  ) {
    return slot1.start < slot2.end && slot1.end > slot2.start
  }
}
