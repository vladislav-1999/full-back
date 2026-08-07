import { db } from '../db/index.js'
import { type User, UserWithStats } from '../types/user.js'
import { eq, count, sql } from 'drizzle-orm'
import { users, tasks } from '../db/schema.js'

export const usersRepository = {
	async findAll(): Promise<UserWithStats[]> {
		return db
			.select({
				id: users.id,
				email: users.email,
				role: users.role,
				createdAt: users.createdAt,
				tasksCount: count(tasks.id),
				doneCount: sql<number>`count(*) filter (where ${tasks.done})`.mapWith(Number),
			})
			.from(users)
			.leftJoin(tasks, eq(tasks.userId, users.id))
			.groupBy(users.id)
			.orderBy(users.id)
	},
	async findByEmail(email: string): Promise<User | undefined> {
		const rows = await db.select().from(users).where(eq(users.email, email))
		return rows[0]
	},
	async create(email: string, passwordHash: string): Promise<User> {
		const rows = await db.insert(users).values({ email, passwordHash }).returning()
		return rows[0]!
	},
	async findById(id: number): Promise<User | undefined> {
		const rows = await db.select().from(users).where(eq(users.id, id))
		return rows[0]
	},
}
