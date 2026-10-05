import User from '#models/user'
import Event from '#models/events'
import Center from '#models/centers'
import Speciality from '#models/speciality'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Roles from '../enums/roles.js'

export default class StatisticsController {
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
