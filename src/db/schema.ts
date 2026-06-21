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

export const refreshTokens = pgTable('refresh_tokens', {
	id: integer().primaryKey().generatedByDefaultAsIdentity(),
	userId: integer()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	tokenHash: varchar({ length: 64 }).notNull().unique(),
	expiresAt: timestamp({ withTimezone: true }).notNull(),
	revokedAt: timestamp({ withTimezone: true }),
	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
