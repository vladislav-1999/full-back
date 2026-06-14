import { tasksRepository } from '../repositories/tasksRepository.js'
import type { Task } from '../types/task.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'
import { NotFoundError } from '../errors.js'

export const tasksService = {
	async getAll(): Promise<Task[]> {
		return tasksRepository.findAll()
	},

	async getById(id: number): Promise<Task> {
		const task = await tasksRepository.findById(id)
		if (!task) {
			throw new NotFoundError('Task not found')
		}
		return task
	},

	async create(input: CreateTaskInput): Promise<Task> {
		return tasksRepository.create(input)
	},

	async update(id: number, input: UpdateTaskInput): Promise<Task> {
		const updated = await tasksRepository.update(id, input)

		if (!updated) {
			throw new NotFoundError('Task not found')
		}

		return updated
	},

	async remove(id: number): Promise<void> {
		const ok = await tasksRepository.remove(id)
		if (!ok) {
			throw new NotFoundError('Task not found')
		}
	},
}
