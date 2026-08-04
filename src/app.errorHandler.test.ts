import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from './app.js'

describe('терминальный обработчик ошибок и 404', () => {
	it('несуществующий роут -> 404 JSON, а не HTML от finalhandler', async () => {
		const res = await request(app).get('/no-such-route')

		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'Not found' })
		expect(res.headers['content-type']).toMatch(/application\/json/)
	})

	it('тело больше лимита -> 413 Payload too large', async () => {
		const res = await request(app)
			.post('/tasks')
			.set('Content-Type', 'application/json')
			.send('{"title":"' + 'a'.repeat(20_000) + '"}')

		expect(res.status).toBe(413)
		expect(res.body).toEqual({ error: 'Payload too large' })
	})

	it('битый JSON -> 400 Invalid JSON', async () => {
		const res = await request(app).post('/tasks').set('Content-Type', 'application/json').send('{ broken')

		expect(res.status).toBe(400)
		expect(res.body).toEqual({ error: 'Invalid JSON' })
	})

	it('ответ об ошибке не содержит внутренностей приложения', async () => {
		const res = await request(app).post('/tasks').set('Content-Type', 'application/json').send('{ broken')
		const raw = JSON.stringify(res.body)

		expect(raw).not.toMatch(/node_modules/)
		expect(raw).not.toMatch(/D:\\|\/home\/|at \w+ \(/)
		expect(raw).not.toMatch(/body-parser|raw-body|pino/)
	})
})

describe('доступ к документации по флагу ENABLE_DOCS', () => {
	it('ENABLE_DOCS включён -> /openapi.json отдаёт документ', async () => {
		const res = await request(app).get('/openapi.json')

		expect(res.status).toBe(200)
		expect(res.body.openapi).toMatch(/^3\./)
	})
})
