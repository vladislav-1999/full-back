// Слой маршрутизации. Связывает URL-ы с методами контроллера. Самый тонкий файл — буквально таблица соответствий

import { Router } from 'express'
import { registerSchema } from '../schemas/authSchemas.js'
import { validate } from '../middlewares/validate.js'
import { authController } from '../controllers/authController.js'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)

export default router
