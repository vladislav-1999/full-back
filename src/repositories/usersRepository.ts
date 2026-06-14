import { db } from '../db/index.js'
import { type User } from '../types/user.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const usersRepository = {
	async findByEmail(email: string): Promise<User | undefined> {
		const rows = await db.select().from(users).where(eq(users.email, email))
		return rows[0]
	},
	async create(email: string, passwordHash: string): Promise<User> {
		const rows = await db.insert(users).values({ email, passwordHash }).returning()
		return rows[0]!
	},
}
