import { config } from 'dotenv'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

config({ path: '.env.test' })

function maskPassword(url: string): string {
	return url.replace(/:[^:@/]*@/, ':***@')
}

function assertTestDatabase(): void {
	const url = process.env.DATABASE_URL

	if (!url) {
		throw new Error('DATABASE_URL не задан: тестам нужна отдельная тестовая база')
	}
	if (!/\/todo_test(\?|$)/.test(url)) {
		throw new Error(`Тесты выполняют TRUNCATE и запускаются только против базы todo_test. Получено: ${maskPassword(url)}`)
	}
}

export default async function setup() {
	assertTestDatabase()

	const pool = new Pool({ connectionString: process.env.DATABASE_URL })
	const db = drizzle(pool)

	await migrate(db, { migrationsFolder: './drizzle' })

	await pool.end()
}
