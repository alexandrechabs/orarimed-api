import AuthController from '#controllers/auth_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/register', [AuthController, 'register']) // Ajout de la route d'inscription
router.post('/login', [AuthController, 'login'])
router
  .get('/user/me', [AuthController, 'me'])
  .use([middleware.auth(), middleware.role(['USER', 'DOCTOR', 'ADMIN'])])
