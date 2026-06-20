import { tasksService } from '../services/tasksService.js'
import type { CreateTaskInput, UpdateTaskInput, TaskIdParam } from '../schemas/taskSchemas.js'
import { handleErrors } from './handleErrors.js'

export const taskController = {
	getAll: handleErrors(async (_req, res) => {
		const tasks = await tasksService.getAll()
		res.json(tasks)
	}),

	getById: handleErrors<TaskIdParam>(async (req, res) => {
		const { id } = req.params
		res.json(await tasksService.getById(id))
	}),

	create: handleErrors<Record<string, string>, CreateTaskInput>(async (req, res) => {
		const input = req.body
		res.status(201).json(await tasksService.create(input))
	}),

	update: handleErrors<TaskIdParam, UpdateTaskInput>(async (req, res) => {
		const { id } = req.params
		const input = req.body
		res.json(await tasksService.update(id, input))
	}),

	remove: handleErrors<TaskIdParam>(async (req, res) => {
		const { id } = req.params
		await tasksService.remove(id)
		res.status(204).end()
	}),
}
