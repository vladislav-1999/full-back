import type { Request, Response, RequestHandler } from 'express'
import { tasksService, NotFoundError } from '../services/tasksService.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'

function handleErrors(fn: (req: Request, res: Response) => void | Promise<void>): RequestHandler {
	return async (req, res) => {
		try {
			await fn(req, res)
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({ error: err.message })
				return
			}
			console.error(err)
			res.status(500).json({ error: 'Internal server error' })
		}
	}
}

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
