import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('./db/index.js', () => ({
	db: { execute: vi.fn() },
}))

vi.mock('./lib/serverState.js', () => ({
	isShuttingDown: vi.fn(() => false),
	markShuttingDown: vi.fn(),
}))

import app from './app.js'
import { db } from './db/index.js'
import { isShuttingDown } from './lib/serverState.js'

describe('GET /ready (readiness)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(isShuttingDown).mockReturnValue(false)
	})

	it('БД отвечает -> 200 ready', async () => {
		vi.mocked(db.execute).mockResolvedValue(undefined as never)

		const res = await request(app).get('/ready')

		expect(res.status).toBe(200)
		expect(res.body).toEqual({ status: 'ready' })
	})

	it('идёт graceful shutdown -> 503 и в БД НЕ ходим', async () => {
		vi.mocked(isShuttingDown).mockReturnValue(true)

		const res = await request(app).get('/ready')

		expect(res.status).toBe(503)
		expect(res.body).toEqual({ status: 'shutting_down' })

		expect(db.execute).not.toHaveBeenCalled()
	})

	it('БД недоступна -> 503 db_unavailable, а не 500', async () => {
		vi.mocked(db.execute).mockRejectedValue(new Error('connection refused'))

		const res = await request(app).get('/ready')

		expect(res.status).toBe(503)
		expect(res.body).toEqual({ status: 'db_unavailable' })
	})
})
