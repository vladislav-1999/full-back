// tasksService - слой бизнес-логики

import { tasksRepository } from '../repositories/tasksRepository.js'
import type { Task } from '../types/task.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'

// Наши кастомные классы ошибок.
// Имена классов несут СМЫСЛ — а не HTTP-коды.
// Превращение в 404/400 — задача controller'а.
export class NotFoundError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'NotFoundError'
	}
}

export const tasksService = {
	getAll(): Task[] {
		return tasksRepository.findAll()
	},

	getById(id: number): Task {
		const task = tasksRepository.findById(id)
		if (!task) {
			throw new NotFoundError('Task not found')
		}
		return task
	},

	create(input: CreateTaskInput): Task {
		return tasksRepository.create(input)
	},

	update(id: number, input: UpdateTaskInput): Task {
		const updated = tasksRepository.update(id, input)

		if (!updated) {
			throw new NotFoundError('Task not found')
		}

		return updated
	},

	remove(id: number): void {
		const ok = tasksRepository.remove(id)
		if (!ok) {
			throw new NotFoundError('Task not found')
		}
	},
}
