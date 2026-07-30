import express from 'express'
import cors from 'cors'
import tasksRoutes from './routes/tasksRoutes.js'
import authRoutes from './routes/authRoutes.js'
import { requireAuth } from './middlewares/requireAuth.js'
import swaggerUi from 'swagger-ui-express'
import { openapiDocument } from './docs/openapi.js'
import { requireRole } from './middlewares/requireRole.js'
import adminRoutes from './routes/adminRoutes.js'
import { httpLogger } from './lib/httpLogger.js'
import { env } from './config.js'
import helmet from 'helmet'
import { sql } from 'drizzle-orm'
import { db } from './db/index.js'
import { isShuttingDown } from './lib/serverState.js'
import { apiLimiter, loginLimiter, registerLimiter } from './lib/rateLimiters.js'

const app = express()

app.set('trust proxy', env.TRUST_PROXY)

app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				...helmet.contentSecurityPolicy.getDefaultDirectives(),
				'script-src': ["'self'", "'unsafe-inline'"],
				'style-src': ["'self'", "'unsafe-inline'"],
				'img-src': ["'self'", 'data:', 'validator.swagger.io'],
			},
		},
	}),
)

app.use(cors({ origin: env.CORS_ORIGIN }))

app.use(httpLogger)

app.use(express.json())

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', uptime: process.uptime() })
})

app.get('/ready', async (req, res) => {
	if (isShuttingDown()) {
		res.status(503).json({ status: 'shutting_down' })
		return
	}

	try {
		await db.execute(sql`select 1`)

		res.json({ status: 'ready' })
	} catch (err) {
		req.log.error({ err }, 'Readiness check failed')

		res.status(503).json({ status: 'db_unavailable' })
	}
})

app.use(apiLimiter)

app.post('/auth/login', loginLimiter)

app.post('/auth/register', registerLimiter)

app.use('/tasks', requireAuth, tasksRoutes)

app.use('/auth', authRoutes)

app.get('/openapi.json', (_req, res) => {
	res.json(openapiDocument)
})

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument))

app.use('/admin', requireAuth, requireRole('admin'), adminRoutes)

export default app
