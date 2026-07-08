import { config } from 'dotenv'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

config({ path: '.env.test' })

export default async function setup() {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL })
	const db = drizzle(pool)

	await migrate(db, { migrationsFolder: './drizzle' })

	await pool.end()
}
