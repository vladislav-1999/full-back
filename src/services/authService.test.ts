import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../repositories/usersRepository.js', () => ({
	usersRepository: {
		findByEmail: vi.fn(),
		create: vi.fn(),
		findById: vi.fn(),
	},
}))

vi.mock('../repositories/refreshTokenRepository.js', () => ({
	refreshTokensRepository: {
		create: vi.fn(),
		findByHash: vi.fn(),
		revoke: vi.fn(),
		revokeAllForUser: vi.fn(),
	},
}))

vi.mock('argon2', () => ({
	default: { hash: vi.fn(), verify: vi.fn() },
}))

vi.mock('../lib/tokens.js', () => ({
	signAccessToken: vi.fn(() => 'fake.access.token'),
}))

import { authService } from './authService.js'
import { usersRepository } from '../repositories/usersRepository.js'
import { refreshTokensRepository } from '../repositories/refreshTokenRepository.js'
import { UnauthorizedError } from '../errors.js'
import argon2 from 'argon2'
import type { User } from '../types/user.js'
import { createHash } from 'node:crypto'
import { refreshTokens } from '../db/schema.js'

type RefreshRow = typeof refreshTokens.$inferSelect

function makeUser(overrides: Partial<User> = {}): User {
	return {
		id: 7,
		email: 'user@example.com',
		passwordHash: 'argon2-hash',
		role: 'user',
		createdAt: new Date('2026-01-01'),
		...overrides,
	}
}

function makeStored(overrides: Partial<RefreshRow> = {}): RefreshRow {
	return {
		id: 1,
		userId: 7,
		tokenHash: 'stored-hash',
		expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		revokedAt: null,
		createdAt: new Date('2026-01-01'),
		...overrides,
	}
}

describe('authService.login', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('Неверный email -> 401, а argon2.verify не вызывается', async () => {
		vi.mocked(usersRepository.findByEmail).mockResolvedValue(undefined)

		await expect(authService.login({ email: 'nope@example.com', password: 'x' })).rejects.toThrow('Invalid credentials')

		expect(argon2.verify).not.toHaveBeenCalled()
	})

	it('Неверный пароль -> 401, а argon2.verify не вызывается', async () => {
		const user = makeUser()
		vi.mocked(usersRepository.findByEmail).mockResolvedValue(user)
		vi.mocked(argon2.verify).mockResolvedValue(false)

		await expect(authService.login({ email: user.email, password: 'wrong' })).rejects.toThrow('Invalid credentials')
	})

	it('Успех -> выдыча пары токенов + refresh в БД', async () => {
		const user = makeUser()
		vi.mocked(usersRepository.findByEmail).mockResolvedValue(user)
		vi.mocked(argon2.verify).mockResolvedValue(true)

		const result = await authService.login({ email: user.email, password: 'plaintext' })
		const storedHash = createHash('sha256').update(result.refreshToken).digest('hex')

		expect(result.accessToken).toBe('fake.access.token')
		expect(result.refreshToken).toMatch(/^[0-9a-f]{64}$/)
		expect(argon2.verify).toHaveBeenCalledWith(user.passwordHash, 'plaintext')
		expect(refreshTokensRepository.create).toHaveBeenCalledWith(user.id, storedHash, expect.any(Date))
	})
})

describe('authService.refresh', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('Токен не найден -> 401, каскадный отзыв НЕ трогаем', async () => {
		vi.mocked(refreshTokensRepository.findByHash).mockResolvedValue(undefined)

		await expect(authService.refresh('whatever')).rejects.toThrow('Invalid refresh token')

		expect(refreshTokensRepository.revokeAllForUser).not.toHaveBeenCalled()
	})

	it('reuse (токен уже отозван) -> отзыв ВСЕХ токенов юзера + 401', async () => {
		vi.mocked(refreshTokensRepository.findByHash).mockResolvedValue(makeStored({ revokedAt: new Date() }))

		await expect(authService.refresh('stolen')).rejects.toThrow('Invalid refresh token')

		expect(refreshTokensRepository.revokeAllForUser).toHaveBeenCalledWith(7)
	})

	it('И отозван, протух -> срабатывает ветка REUSE, а не "протух" (ПОРЯДОК веток)', async () => {
		vi.mocked(refreshTokensRepository.findByHash).mockResolvedValue(makeStored({ revokedAt: new Date(), expiresAt: new Date(Date.now() - 1000) }))

		await expect(authService.refresh('x')).rejects.toThrow('Invalid refresh token')

		expect(refreshTokensRepository.revokeAllForUser).toHaveBeenCalledWith(7)
	})

	it('Протух, но не отозван -> 401 "expired", без каскада, без ротации', async () => {
		vi.mocked(refreshTokensRepository.findByHash).mockResolvedValue(makeStored({ expiresAt: new Date(Date.now() - 1000) }))

		await expect(authService.refresh('x')).rejects.toThrow('Refresh token expired')

		expect(refreshTokensRepository.revokeAllForUser).not.toHaveBeenCalled()
		expect(refreshTokensRepository.revoke).not.toHaveBeenCalled()
	})

	it('Валидный токен -> ротация: старый сжечь + выдать новую пару (хеш в БД)', async () => {
		const stored = makeStored()
		vi.mocked(refreshTokensRepository.findByHash).mockResolvedValue(stored)
		vi.mocked(usersRepository.findById).mockResolvedValue(makeUser())

		const result = await authService.refresh('valid-raw')

		expect(refreshTokensRepository.revoke).toHaveBeenCalledWith(stored.id)
		expect(result.accessToken).toBe('fake.access.token')
		expect(result.refreshToken).toMatch(/[0-9a-f]{64}$/)

		const newHash = createHash('sha256').update(result.refreshToken).digest('hex')
		expect(refreshTokensRepository.create).toHaveBeenCalledWith(7, newHash, expect.any(Date))
		expect(refreshTokensRepository.revokeAllForUser).not.toHaveBeenCalled()
	})

	it('Юзер удален между выдачей и refresh -> 401 (гард findById)', async () => {
		vi.mocked(refreshTokensRepository.findByHash).mockResolvedValue(makeStored())
		vi.mocked(usersRepository.findById).mockResolvedValue(undefined)

		await expect(authService.refresh('x')).rejects.toThrow('Invalid refresh token')
	})
})
