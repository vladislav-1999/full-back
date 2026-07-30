import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import type { Express } from 'express'

describe('rate limit на POST /auth/login', () => {
	let app: Express

	beforeAll(async () => {
		vi.stubEnv('RATE_LIMIT_LOGIN', '2')
		vi.resetModules()
		app = (await import('./app.js')).default
	})

	afterAll(() => {
		vi.unstubAllEnvs()
		vi.resetModules()
	})

	it('третья неудачная попытка входа -> 429 с телом ошибки', async () => {
		const credentials = { email: 'nobody@test.dev', password: 'wrongpass' }
		const first = await request(app).post('/auth/login').send(credentials)
		const second = await request(app).post('/auth/login').send(credentials)
		const third = await request(app).post('/auth/login').send(credentials)

		expect(first.status).toBe(401)
		expect(second.status).toBe(401)
		expect(third.status).toBe(429)
		expect(third.body).toEqual({ error: 'Too many login attempts' })
		expect(third.headers['ratelimit']).toBeDefined()
	})
})
