//  Слой HTTP

import type { Request, Response, RequestHandler } from 'express'
import { tasksService, NotFoundError } from '../services/tasksService.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'

// Маленький помощник, чтобы не повторять try/catch в каждом методе.
// Берёт async-функцию, оборачивает в try/catch с правильными HTTP-кодами.

function handleErrors(fn: (req: Request, res: Response) => void | Promise<void>): RequestHandler {
	return async (req, res) => {
		try {
			await fn(req, res)
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({ error: err.message })
				return
			}
			// Что-то неизвестное — это уже наша ошибка, не клиента.
			console.error(err)
			res.status(500).json({ error: 'Internal server error' })
		}
	}
}

export const taskController = {
	getAll: handleErrors((_req, res) => {
		const tasks = tasksService.getAll()
		res.json(tasks)
	}),

	getById: handleErrors((req, res) => {
		const { id } = req.params as unknown as { id: number }
		res.json(tasksService.getById(id))
	}),

	create: handleErrors((req, res) => {
		const input = req.body as CreateTaskInput
		res.status(201).json(tasksService.create(input))
	}),

	update: handleErrors((req, res) => {
		const { id } = req.params as unknown as { id: number }
		const input = req.body as UpdateTaskInput
		res.json(tasksService.update(id, input))
	}),

	remove: handleErrors((req, res) => {
		const { id } = req.params as unknown as { id: number }
		tasksService.remove(id)
		res.status(204).end()
	}),
}
