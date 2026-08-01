import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config.js'
import * as schema from './schema.js'

const pool = new Pool({
	connectionString: env.DATABASE_URL,
})

export const db = drizzle(pool, { schema, casing: 'snake_case' })
export type Db = typeof db
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
export type DbOrTx = Db | Tx
