import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks } from '../db/schema.js'
import type { Task } from '../types/task.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'

const taskColumns = { id: tasks.id, title: tasks.title, done: tasks.done }

export const tasksRepository = {
	async findAll(userId: number): Promise<Task[]> {
		return db.select(taskColumns).from(tasks).where(eq(tasks.userId, userId))
	},

	async findById(id: number, userId: number): Promise<Task | undefined> {
		const rows = await db
			.select(taskColumns)
			.from(tasks)
			.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
		return rows[0]
	},

	async create(input: CreateTaskInput, userId: number): Promise<Task> {
		const rows = await db.insert(tasks).values({ title: input.title, userId }).returning(taskColumns)
		return rows[0]!
	},

	async update(id: number, changes: UpdateTaskInput, userId: number): Promise<Task | undefined> {
		const rows = await db
			.update(tasks)
			.set(changes)
			.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
			.returning(taskColumns)
		return rows[0]
	},

	async remove(id: number, userId: number): Promise<boolean> {
		const rows = await db
			.delete(tasks)
			.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
			.returning(taskColumns)
		return rows.length > 0
	},
}
