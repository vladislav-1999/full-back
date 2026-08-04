import { describe, it, expect, vi } from 'vitest'

vi.mock('./config.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./config.js')>()
	return { env: { ...actual.env, ENABLE_DOCS: false } }
})

import app from './app.js'
import request from 'supertest'

describe('ENABLE_DOCS = false', () => {
	it('/docs недоступен и отвечает штатным 404 API, а не HTML', async () => {
		const res = await request(app).get('/docs/')

		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'Not found' })
	})

	it('/openapi.json тоже закрыт — прячем контракт, а не только картинку', async () => {
		const res = await request(app).get('/openapi.json')

		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'Not found' })
	})
})
