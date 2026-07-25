import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { env } from './config.js'
import { logger } from './lib/logger.js'

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 })

const db = drizzle(pool)

async function runMigrations(): Promise<void> {
	logger.info('Running migrations')

	await migrate(db, { migrationsFolder: './drizzle' })

	logger.info('Migrations applied')
}

try {
	await runMigrations()
} catch (err) {
	logger.error({ err }, 'Migration failed')

	process.exitCode = 1
} finally {
	await pool.end()
}
