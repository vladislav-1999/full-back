import { tasksRepository } from '../repositories/tasksRepository.js'
import type { Task } from '../types/task.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'
import { NotFoundError } from '../errors.js'

export const tasksService = {
	async getAll(userId: number): Promise<Task[]> {
		return tasksRepository.findAll(userId)
	},

	async getById(id: number, userId: number): Promise<Task> {
		const task = await tasksRepository.findById(id, userId)
		if (!task) {
			throw new NotFoundError('Task not found')
		}
		return task
	},

	async create(input: CreateTaskInput, userId: number): Promise<Task> {
		return tasksRepository.create(input, userId)
	},

	async update(id: number, input: UpdateTaskInput, userId: number): Promise<Task> {
		const updated = await tasksRepository.update(id, input, userId)

		if (!updated) {
			throw new NotFoundError('Task not found')
		}

		return updated
	},

	async remove(id: number, userId: number): Promise<void> {
		const ok = await tasksRepository.remove(id, userId)
		if (!ok) {
			throw new NotFoundError('Task not found')
		}
	},
}
