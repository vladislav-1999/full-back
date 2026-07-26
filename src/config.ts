import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
	DATABASE_URL: z.url(),
	JWT_SECRET: z.string().min(32),
	PORT: z.coerce.number().int().positive().max(65535).default(3001),
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
	CORS_ORIGIN: z
		.string()
		.default('http://localhost:3000')
		.transform((raw) =>
			raw
				.split(',')
				.map((origin) => origin.trim())
				.filter(Boolean),
		)
		.pipe(z.array(z.url()).nonempty()),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
	console.error('Invalid environment variables:')
	console.error(z.prettifyError(result.error))
	process.exit(1)
}

export const env = result.data
