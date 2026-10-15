import User from '#models/user'
import Event from '#models/events'
import Center from '#models/centers'
import Speciality from '#models/speciality'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import Roles from '../enums/roles.js'

export default class StatisticsController {
  async indexDoctor({ auth }: HttpContext) {
    const doctorId = auth.user!.id
    const now = DateTime.now().setZone('Europe/Paris')
    const todayStart = now.startOf('day')
    const tomorrowStart = todayStart.plus({ days: 1 })
    const weekStart = now.startOf('week')
    const nextWeekStart = weekStart.plus({ weeks: 1 })

    const [
      todayAppointments,
      weekAppointments,
      todayAppointmentStatusRows,
      weekAppointmentStatusRows,
    ] = await Promise.all([
      Event.query()
        .where('practitionerId', doctorId)
        .where('type', 'appointment')
        .where('start', '>=', todayStart.toJSDate())
        .where('start', '<', tomorrowStart.toJSDate())
        .count('* as total'),
      Event.query()
        .where('practitionerId', doctorId)
        .where('type', 'appointment')
        .where('start', '>=', weekStart.toJSDate())
        .where('start', '<', nextWeekStart.toJSDate())
        .count('* as total'),
      db
        .from('events')
        .select('status')
        .count('* as total')
        .where('start', '>=', todayStart.toJSDate())
        .where('start', '<', tomorrowStart.toJSDate())
        .where('practitioner_id', doctorId)
        .where('type', 'appointment')
        .groupBy('status')
        .orderBy('status', 'asc'),
      db
        .from('events')
        .select('status')
        .count('* as total')
        .where('start', '>=', weekStart.toJSDate())
        .where('start', '<', nextWeekStart.toJSDate())
        .where('practitioner_id', doctorId)
        .where('type', 'appointment')
        .groupBy('status')
        .orderBy('status', 'asc'),
    ])

    return {
      todayAppointments: Number(todayAppointments[0]?.$extras.total ?? 0),
      todayAppointmentStatuses: todayAppointmentStatusRows.map((row) => ({
        status: row.status ?? 'unknown',
        appointments: Number(row.total),
      })),
      weekAppointments: Number(weekAppointments[0]?.$extras.total ?? 0),
      weekAppointmentStatuses: weekAppointmentStatusRows.map((row) => ({
        status: row.status ?? 'unknown',
        appointments: Number(row.total),
      })),
    }
  }

  async index() {
    const currentMonth = DateTime.now().startOf('month')
    const firstMonth = currentMonth.minus({ months: 11 })
    const nextMonth = currentMonth.plus({ months: 1 })
    const now = DateTime.now().toJSDate()
    const [
      users,
      doctors,
      secretaries,
      appointments,
      upcomingAppointments,
      offices,
      monthlyAppointmentRows,
      specialities,
      doctorCountsBySpeciality,
    ] = await Promise.all([
      User.query().where('roleId', Roles.USER).count('* as total'),
      User.query().where('roleId', Roles.DOCTOR).count('* as total'),
      User.query().where('roleId', Roles.SECRETARY).count('* as total'),
      Event.query().where('type', 'appointment').count('* as total'),
      Event.query()
        .where('type', 'appointment')
        .andWhere((query) => {
          query
            .where('start', '>=', now)
            .orWhere('startRecur', '>=', now)
            .orWhere('endRecur', '>=', now)
        })
        .count('* as total'),
      Center.query().count('* as total'),
      db
        .from('events')
        .select(db.raw("TO_CHAR(DATE_TRUNC('month', start), 'YYYY-MM') as month"))
        .count('* as total')
        .where('type', 'appointment')
        .whereNotNull('start')
        .where('start', '>=', firstMonth.toJSDate())
        .where('start', '<', nextMonth.toJSDate())
        .groupByRaw("DATE_TRUNC('month', start)")
        .orderBy('month', 'asc'),
      Speciality.query().orderBy('position', 'asc'),
      db
        .from('users')
        .select('speciality_id')
        .count('* as total')
        .where('role_id', Roles.DOCTOR)
        .whereNotNull('speciality_id')
        .groupBy('speciality_id'),
    ])

    const appointmentCountsByMonth = new Map(
      monthlyAppointmentRows.map((row) => [row.month, Number(row.total)])
    )
    const appointmentsByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = firstMonth.plus({ months: index }).toFormat('yyyy-MM')
      return {
        month,
        appointments: appointmentCountsByMonth.get(month) ?? 0,
      }
    })
    const doctorsBySpecialityCount = new Map(
      doctorCountsBySpeciality.map((row) => [Number(row.speciality_id), Number(row.total)])
    )
    const doctorsBySpeciality = specialities.map((speciality) => ({
      specialityId: speciality.id,
      slug: speciality.slug,
      doctors: doctorsBySpecialityCount.get(speciality.id) ?? 0,
    }))

    return {
      users: Number(users[0]?.$extras.total ?? 0),
      doctors: Number(doctors[0]?.$extras.total ?? 0),
      secretaries: Number(secretaries[0]?.$extras.total ?? 0),
      appointments: Number(appointments[0]?.$extras.total ?? 0),
      upcomingAppointments: Number(upcomingAppointments[0]?.$extras.total ?? 0),
      offices: Number(offices[0]?.$extras.total ?? 0),
      appointmentsByMonth,
      doctorsBySpeciality,
    }
  }
}
