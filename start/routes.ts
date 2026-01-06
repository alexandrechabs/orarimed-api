import AuthController from '#controllers/auth_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import UsersController from '#controllers/users_controller'

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
  .get('/users', [UsersController, 'index'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router
  .put('/user/:id', [UsersController, 'update'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
router
  .delete('/user/:id', [UsersController, 'destroy'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
