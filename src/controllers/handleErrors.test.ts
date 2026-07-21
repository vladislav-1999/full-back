import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { handleErrors } from './handleErrors.js'
import { NotFoundError, ConflictError, UnauthorizedError } from '../errors.js'

const makeRes = () => {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response
	return res
}

const req = {} as Request

describe('handleErrors', () => {
	it('NotFoundError -> 404 + сообщение домена', async () => {
		const res = makeRes()
		await handleErrors(async () => {
			throw new NotFoundError('Task not found')
		})(req, res, vi.fn())

		expect(res.status).toHaveBeenCalledWith(404)
		expect(res.json).toHaveBeenCalledWith({ error: 'Task not found' })
	})

	it('ConflictError -> 409', async () => {
		const res = makeRes()
		await handleErrors(async () => {
			throw new ConflictError('Email already taken')
		})(req, res, vi.fn())

		expect(res.status).toHaveBeenCalledWith(409)
	})

	it('UnauthorizedError -> 401', async () => {
		const res = makeRes()
		await handleErrors(async () => {
			throw new UnauthorizedError('Invalid credentials')
		})(req, res, vi.fn())

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('неизвестная ошибка -> 500 generic, детали НЕ утекают клиенту', async () => {
		const res = makeRes()
		const secret = 'relation "users" does not exist: password=hunter2'

		await handleErrors(async () => {
			throw new Error(secret)
		})(req, res, vi.fn())

		expect(res.status).toHaveBeenCalledWith(500)
		expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
		expect(JSON.stringify(vi.mocked(res.json).mock.calls)).not.toContain(secret)
		expect(res.err).toBeInstanceOf(Error)
		expect(res.err?.message).toBe(secret)
	})

	it('брошено не-Error (throw "строка") -> всё равно заворачивается в Error', async () => {
		const res = makeRes()
		await handleErrors(async () => {
			throw 'boom'
		})(req, res, vi.fn())

		expect(res.err).toBeInstanceOf(Error)
		expect(res.err?.message).toBe('boom')
	})
})
