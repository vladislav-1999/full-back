import { tasksService } from '../services/tasksService.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'
import { handleErrors } from './handleErrors.js'

export const taskController = {
	getAll: handleErrors(async (_req, res) => {
		const tasks = await tasksService.getAll()
		res.json(tasks)
	}),

	getById: handleErrors(async (req, res) => {
		const { id } = req.params as unknown as { id: number }
		res.json(await tasksService.getById(id))
	}),

	create: handleErrors(async (req, res) => {
		const input = req.body as CreateTaskInput
		res.status(201).json(await tasksService.create(input))
	}),

	update: handleErrors(async (req, res) => {
		const { id } = req.params as unknown as { id: number }
		const input = req.body as UpdateTaskInput
		res.json(await tasksService.update(id, input))
	}),

	remove: handleErrors(async (req, res) => {
		const { id } = req.params as unknown as { id: number }
		await tasksService.remove(id)
		res.status(204).end()
	}),
}
