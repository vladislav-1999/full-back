import 'dotenv/config'
import { z } from 'zod'

const envSchema = z
	.object({
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
		TRUST_PROXY: z.coerce.number().int().min(0).default(0),
		RATE_LIMIT_API: z.coerce.number().int().positive().default(300),
		RATE_LIMIT_LOGIN: z.coerce.number().int().positive().default(5),
		RATE_LIMIT_REGISTER: z.coerce.number().int().positive().default(10),
		ENABLE_DOCS: z.stringbool().optional(),
	})
	.transform((cfg) => ({
		...cfg,
		ENABLE_DOCS: cfg.ENABLE_DOCS ?? cfg.NODE_ENV !== 'production',
	}))

const result = envSchema.safeParse(process.env)

if (!result.success) {
	console.error('Invalid environment variables:')
	console.error(z.prettifyError(result.error))
	process.exit(1)
}

export const env = result.data
