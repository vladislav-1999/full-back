import { Router } from 'express'
import { loginSchema, refreshSchema, registerSchema } from '../schemas/authSchemas.js'
import { validate } from '../middlewares/validate.js'
import { authController } from '../controllers/authController.js'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/logout', validate(refreshSchema), authController.logout)
router.post('/refresh', validate(refreshSchema), authController.refresh)

export default router
