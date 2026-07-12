import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { requireRole } from './requireRole.js'

const makeRes = () => {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn(),
	}

	return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }
}

const makeReq = (user?: { id: number; role: string }) => ({ user }) as unknown as Request

describe('requireRole', () => {
	beforeEach(() => vi.clearAllMocks())

	it('401 unauthorized, если req.user нет (requireAuth не отработал)', () => {
		const req = makeReq()
		const res = makeRes()
		const next = vi.fn()

		requireRole('admin')(req, res, next)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
		expect(next).not.toHaveBeenCalled()
	})

	it('403 Forbidden, если роль не входит в список разрешенных', () => {
		const req = makeReq({ id: 1, role: 'user' })
		const res = makeRes()
		const next = vi.fn()

		requireRole('admin')(req, res, next)

		expect(res.status).toHaveBeenCalledWith(403)
		expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
		expect(next).not.toHaveBeenCalled()
	})

	it('пропускает дальше (next), если роль разрешена', () => {
		const req = makeReq({ id: 1, role: 'admin' })
		const res = makeRes()
		const next = vi.fn()

		requireRole('admin')(req, res, next)

		expect(next).toHaveBeenCalledTimes(1)
		expect(res.status).not.toHaveBeenCalled()
	})

	it('принимает ЛЮБУЮ из перечисленных ролей (rest-параметр)', () => {
		const req = makeReq({ id: 1, role: 'moderator' })
		const res = makeRes()
		const next = vi.fn()

		requireRole('admin', 'moderator')(req, res, next)

		expect(next).toHaveBeenCalledTimes(1)
		expect(res.status).not.toHaveBeenCalled()
	})
})
