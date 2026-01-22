import AuthController from '#controllers/auth_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import UsersController from '#controllers/users_controller'
import EventsController from '#controllers/events_controller'
import SpecialitiesController from '#controllers/specialities_controller'

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
  .delete('/user/:id', [UsersController, 'destroy'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router
  .get('user/:id/opening-hours', [UsersController, 'getOpeningHours'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router
  .post('user/:id/opening-hours', [UsersController, 'addOpeningHour'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('patients/search', [UsersController, 'searchPatient'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .get('patients/:id', [UsersController, 'showPatient'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('events', [EventsController, 'create'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .get('events', [EventsController, 'index'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .put('events/:id', [EventsController, 'update'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router.get('specialities', [SpecialitiesController, 'index'])
router.post('specialities', [SpecialitiesController, 'create'])
