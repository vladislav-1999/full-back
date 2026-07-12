import { db } from '../db/index.js'
import { type User, PublicUser } from '../types/user.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

const publicUserColumns = {
	id: users.id,
	email: users.email,
	role: users.role,
	createdAt: users.createdAt,
}

export const usersRepository = {
	async findAll(): Promise<PublicUser[]> {
		return db.select(publicUserColumns).from(users)
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
