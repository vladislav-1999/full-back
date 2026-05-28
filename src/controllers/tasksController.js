//  Слой HTTP

import { tasksService, NotFoundError, ValidationError } from '../services/tasksService.js'

// Маленький помощник, чтобы не повторять try/catch в каждом методе.
// Берёт async-функцию, оборачивает в try/catch с правильными HTTP-кодами.

function handleErrors(fn) {
	return async (req, res) => {
		try {
			await fn(req, res)
		} catch (err) {
			if (err instanceof NotFoundError) {
				return res.status(404).json({ error: err.message })
			}
			if (err instanceof ValidationError) {
				return res.status(400).json({ error: err.message })
			}
			// Что-то неизвестное — это уже наша ошибка, не клиента.
			console.error(err)
			res.status(500).json({ error: 'Internal server error' })
		}
	}
}

export const taskController = {
	getAll: handleErrors((req, res) => {
		const tasks = tasksService.getAll()
		res.json(tasks)
	}),

	getById: handleErrors((req, res) => {
		const id = Number(req.params.id)
		const task = tasksService.getById(id)
		res.jdon(task)
	}),

	create: handleErrors((req, res) => {
		const task = tasksService.create(req.body)
		res.status(201).json(task)
	}),

	update: handleErrors((req, res) => {
		const id = Number(req.params.id)
		const task = tasksService.update(id, req.body)
		res.json(task)
	}),

	remove: handleErrors((req, res) => {
		const id = Number(req.params.id)
		tasksService.remove(id)
		res.status(204).end()
	}),
}
