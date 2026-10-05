import AuthController from '#controllers/auth_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import UsersController from '#controllers/users_controller'
import EventsController from '#controllers/events_controller'
import SpecialitiesController from '#controllers/specialities_controller'
import CentersController from '#controllers/centers_controller'
import OtherController from '#controllers/other_controller'
import CategoryController from '#controllers/categoryController'
import ArticlesController from '#controllers/articleController'
import DiplomasController from '#controllers/diplomas_controller'
import ExperiencesController from '#controllers/experiences_controller'
import SitemapController from '#controllers/sitemapController'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
router.get('/sitemap', [SitemapController, 'index']) // Alias sitemap
router.post('/register', [AuthController, 'register']) // Ajout de la route d'inscription
router.post('/login', [AuthController, 'login'])
router.post('/forgot-password', [AuthController, 'forgotPassword'])
router.post('/reset-password', [AuthController, 'resetPassword'])
router.get('/share/*', [OtherController, 'share'])
router.post('/update_mail_status', [OtherController, 'updateMailStatus'])

router
  .post('/verify-email', [AuthController, 'verifyEmail'])
  .use([middleware.auth(), middleware.role(['USER'])])
router
  .post('/resend-verification', [AuthController, 'resendVerificationEmail'])
  .use([middleware.auth(), middleware.role(['USER'])])
router.post('/form', [OtherController, 'form'])
router
  .get('/user/', [UsersController, 'me'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'SECRETARY', 'ADMIN'])])

router
  .get('/user/:id', [UsersController, 'show'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'SECRETARY', 'ADMIN'])])
router
  .put('/user/:id', [UsersController, 'update'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'SECRETARY', 'ADMIN'])])
router
  .post('/user/:id/upload', [UsersController, 'upload'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'SECRETARY', 'ADMIN'])])
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
  .get('user/:id/diplomas', [DiplomasController, 'index'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('user/:id/diplomas', [DiplomasController, 'store'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .put('user/:id/diplomas/:diplomaId', [DiplomasController, 'update'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .delete('user/:id/diplomas/:diplomaId', [DiplomasController, 'destroy'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router
  .get('user/:id/experiences', [ExperiencesController, 'index'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .post('user/:id/experiences', [ExperiencesController, 'store'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .put('user/:id/experiences/:experienceId', [ExperiencesController, 'update'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .delete('user/:id/experiences/:experienceId', [ExperiencesController, 'destroy'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router
  .get('patients/search', [UsersController, 'searchPatient'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'SECRETARY', 'ADMIN'])])
router
  .get('patients/:id', [UsersController, 'showPatient'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'SECRETARY', 'ADMIN'])])

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
  .get('/secretary/:id/doctors', [UsersController, 'getSecretaryDoctors'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'SECRETARY', 'ADMIN'])])
router
  .post('/secretary/:id/doctors', [UsersController, 'addSecretaryDoctors'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'SECRETARY', 'ADMIN'])])

router
  .post('events', [EventsController, 'create'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'SECRETARY', 'ADMIN'])])
router
  .post('doctor/:id/events', [EventsController, 'createRdv'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])

router
  .get('events', [EventsController, 'index'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'SECRETARY', 'ADMIN'])])
router
  .get('events/:id', [EventsController, 'getEventId'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'SECRETARY', 'ADMIN'])])
router
  .put('events/:id', [EventsController, 'update'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'SECRETARY', 'ADMIN'])])

router
  .get('events/:id/notifications', [EventsController, 'getNotifications'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'SECRETARY'])])

router
  .get('contact/:id/events', [EventsController, 'getEventsContact'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'SECRETARY'])])

router.get('specialities', [SpecialitiesController, 'index'])
router
  .post('specialities', [SpecialitiesController, 'create'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])

router.get('categories', [CategoryController, 'index'])
router
  .post('categories', [CategoryController, 'create'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router.get('categories/:id', [CategoryController, 'show'])
router
  .put('categories/:id', [CategoryController, 'update'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .delete('categories/:id', [CategoryController, 'delete'])
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
router
  .get('admin/statistics', [() => import('#controllers/statistics_controller'), 'index'])
  .use([middleware.auth(), middleware.role(['ADMIN'])])

// Articles
router.get('articles', [ArticlesController, 'index'])
router
  .post('articles', [ArticlesController, 'store'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router
  .put('articles/:id', [ArticlesController, 'update'])
  .use([middleware.auth(), middleware.role(['DOCTOR', 'ADMIN'])])
router.get('articles/:id/image/:imageId', [ArticlesController, 'image'])
router.get('articles/:locale/:slug/', [ArticlesController, 'show'])
