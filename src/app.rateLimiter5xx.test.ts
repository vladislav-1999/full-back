import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import type { Express } from 'express'

vi.mock('./services/authService.js', () => ({
	authService: {
		login: vi.fn(async () => {
			throw new Error('database is down')
		}),
		register: vi.fn(),
		refresh: vi.fn(),
		logout: vi.fn(),
	},
}))

describe('5xx не расходуют лимит логина', () => {
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

	it('три подряд 500 при лимите 2 -> 429 не наступает', async () => {
		const credentials = { email: 'user@test.dev', password: 'whatever1' }

		const first = await request(app).post('/auth/login').send(credentials)
		const second = await request(app).post('/auth/login').send(credentials)
		const third = await request(app).post('/auth/login').send(credentials)

		expect(first.status).toBe(500)
		expect(second.status).toBe(500)
		expect(third.status).toBe(500)
		expect(third.body).toEqual({ error: 'Internal server error' })
	})
})
