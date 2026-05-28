// tasksService - слой бизнес-логики

import { tasksRepository } from '../repositories/tasksRepository.js'

export const tasksService = {
	getAll() {
		return tasksRepository.findAll()
	},

	getById(id) {
		const task = tasksRepository.findById(id)
		if (!task) {
			// Бросаем ошибку — controller её поймает и превратит в 404.
			// Service не знает про HTTP-коды, он только сигналит "не нашёл".
			throw new NotFoundError('Task not found')
		}
		return task
	},

	create({ title }) {
		// Бизнес-правило: title должен быть непустой строкой.
		if (typeof title !== 'string' || title.trim() === '') {
			throw new ValidationError('Title must be a non-empty string')
		}
		return tasksRepository.create({ title: title.trim() })
	},

	update(id, { done }) {
		// Бизнес-правило: done должен быть boolean.
		if (typeof done !== 'boolean') {
			throw new ValidationError("Field 'done' must be a boolean")
		}
		const updated = tasksRepository.update(id, { done })
		if (!updated) {
			throw new NotFoundError('Task not found')
		}
		return updated
	},

	remove(id) {
		const ok = tasksRepository.remove(id)
		if (!ok) {
			throw new NotFoundError('Task not found')
		}
	},
}

// Наши кастомные классы ошибок.
// Имена классов несут СМЫСЛ — а не HTTP-коды.
// Превращение в 404/400 — задача controller'а.
export class NotFoundError extends Error {
	constructor(message) {
		super(message)
		this.name = 'NotFoundError'
	}
}

export class ValidationError extends Error {
	constructor(message) {
		super(message)
		this.name = 'ValidationError'
	}
}
