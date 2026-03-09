import AuthController from '#controllers/auth_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import UsersController from '#controllers/users_controller'
import EventsController from '#controllers/events_controller'
import SpecialitiesController from '#controllers/specialities_controller'
import CentersController from '#controllers/centers_controller'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/register', [AuthController, 'register']) // Ajout de la route d'inscription
router.post('/login', [AuthController, 'login'])
router
  .get('/user/', [UsersController, 'me'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])

router
  .get('/user/:id', [UsersController, 'show'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router
  .put('/user/:id', [UsersController, 'update'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router
  .post('/user/:id/upload', [UsersController, 'upload'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router.get('/user/:id/avatar/:avatar', [UsersController, 'getAvatar'])
router.get('user/:id/opening-hours', [UsersController, 'getOpeningHours'])
router
  .post('user/:id/opening-hours', [UsersController, 'addOpeningHour'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .get('user/:id/reasons', [UsersController, 'getReasons'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('user/:id/reasons', [UsersController, 'addReasons'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router
  .post('user/:id/sub-specialities', [SpecialitiesController, 'saveSubSpecialitiesUsers'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router
  .get('patients/search', [UsersController, 'searchPatient'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .get('patients/:id', [UsersController, 'showPatient'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router.get('doctor/search', [UsersController, 'searchDoctor'])
router.get('doctor/search/autocomplete', [UsersController, 'searchDoctorAutoComplete'])
router.get('doctor/:id', [UsersController, 'showDoctor'])
router.get('doctor/:id/available-slots', [UsersController, 'getAvailableSlots'])
router.get('doctor/:id/reasons', [UsersController, 'getReasonsClient'])
router.get('doctor/:id/check-valid-selection', [UsersController, 'checkValidSelection'])
router
  .get('doctor/:id/centers', [UsersController, 'getCenters'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router
  .post('events', [EventsController, 'create'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('doctor/:id/events', [EventsController, 'createRdv'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])

router
  .get('events', [EventsController, 'index'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .put('events/:id', [EventsController, 'update'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router
  .get('contact/:id/events', [EventsController, 'getEventsContact'])
  .use([middleware.auth(), middleware.role(['DOCTOR'])])

router.get('specialities', [SpecialitiesController, 'index'])
router
  .post('specialities', [SpecialitiesController, 'create'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router
  .get('center', [CentersController, 'getCenters'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('center', [CentersController, 'addCenter'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router.get('center/:id', [CentersController, 'getCenter'])
router
  .put('center/:id', [CentersController, 'updateCenter'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router.get('center/:id/opening-hours', [CentersController, 'getOpeningHours'])
router
  .post('center/:id/opening-hours', [CentersController, 'addOpeningHour'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router.get('center/:id/doctors', [CentersController, 'getDoctors'])
router
  .post('center/:id/doctors', [CentersController, 'addDoctors'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('/center/:id/upload', [CentersController, 'upload'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router.get('/center/:id/avatar/:avatar', [CentersController, 'getAvatar'])

router
  .get('admin/user', [UsersController, 'getUsersAdmin'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('admin/user', [UsersController, 'addUserAdmin'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .put('admin/user/:id', [UsersController, 'updateUserAdmin'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
