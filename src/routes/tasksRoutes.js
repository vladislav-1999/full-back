// Слой маршрутизации. Связывает URL-ы с методами контроллера. Самый тонкий файл — буквально таблица соответствий

import { Router } from 'express'
import { taskController } from '../controllers/tasksController.js'

const router = Router()

router.get('/', taskController.getAll)
router.get('/:id', taskController.getById)
router.post('/', taskController.create)
router.patch('/:id', taskController.update)
router.delete('/', taskController.remove)

export default router
