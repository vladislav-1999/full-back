import { pgTable, integer, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 200 }).notNull(),
	done: boolean().notNull().default(false),
	userId: integer()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
})

export const users = pgTable('users', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	email: varchar({ length: 255 }).notNull().unique(),
	passwordHash: varchar({ length: 255 }).notNull(),
	role: varchar().notNull().default('user'),
	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
