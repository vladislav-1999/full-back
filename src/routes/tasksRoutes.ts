// Слой маршрутизации. Связывает URL-ы с методами контроллера. Самый тонкий файл — буквально таблица соответствий

import { Router } from 'express'
import { taskController } from '../controllers/tasksController.js'
import { validate } from '../middlewares/validate.js'
import { createTaskSchema, updateTaskSchema, taskIdParamSchema } from '../schemas/taskSchemas.js'

const router = Router()

router.get('/', taskController.getAll)
router.get('/:id', validate(taskIdParamSchema, 'params'), taskController.getById)
router.post('/', validate(createTaskSchema), taskController.create)
router.patch('/:id', validate(taskIdParamSchema, 'params'), validate(updateTaskSchema), taskController.update)
router.delete('/:id', validate(taskIdParamSchema, 'params'), taskController.remove)

export default router
