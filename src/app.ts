import express from 'express'
import cors from 'cors'
import tasksRoutes from './routes/tasksRoutes.js'
import authRoutes from './routes/authRoutes.js'
import { requireAuth } from './middlewares/requireAuth.js'
import swaggerUi from 'swagger-ui-express'
import { openapiDocument } from './docs/openapi.js'

const app = express()

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

app.use('/tasks', requireAuth, tasksRoutes)
app.use('/auth', authRoutes)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument))

export default app
