import express from 'express'
import cors from 'cors'
import tasksRoutes from './routes/tasksRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express()

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

app.use('/tasks', tasksRoutes)
app.use('/auth', authRoutes)

export default app
