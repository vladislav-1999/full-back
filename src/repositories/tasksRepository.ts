import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks } from '../db/schema.js'
import type { Task } from '../types/task.js'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas.js'

export const tasksRepository = {
	async findAll(): Promise<Task[]> {
		return db.select().from(tasks)
	},

	async findById(id: number): Promise<Task | undefined> {
		const rows = await db.select().from(tasks).where(eq(tasks.id, id))
		return rows[0]
	},

	async create(input: CreateTaskInput): Promise<Task> {
		const rows = await db.insert(tasks).values({ title: input.title }).returning()
		return rows[0]!
	},

	async update(id: number, changes: UpdateTaskInput): Promise<Task | undefined> {
		const rows = await db.update(tasks).set(changes).where(eq(tasks.id, id)).returning()
		return rows[0]
	},

	async remove(id: number): Promise<boolean> {
		const rows = await db.delete(tasks).where(eq(tasks.id, id)).returning()
		return rows.length > 0
	},
}
