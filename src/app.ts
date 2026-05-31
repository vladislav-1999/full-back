//  Сборка приложения. Создание Express-инстанса, регистрация middleware и роутов.
// Само по себе ничего не делает — описывает, чем приложение является.

import express from 'express'
import cors from 'cors'
import tasksRoutes from './routes/tasksRoutes.js'

const app = express()

// middleware
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

// роуты — приклеиваем роутер задач под префикс /tasks
app.use('/tasks', tasksRoutes)

export default app
