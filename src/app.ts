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

const app = express()

app.use(cors({ origin: 'http://localhost:3000' }))

app.use(httpLogger)

app.use(express.json())

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
