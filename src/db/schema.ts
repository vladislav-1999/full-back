import { pgTable, integer, varchar, boolean } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 200 }).notNull(),
	done: boolean().notNull().default(false),
})
