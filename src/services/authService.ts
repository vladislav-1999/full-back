import { ConflictError, UnauthorizedError } from '../errors.js'
import { usersRepository } from '../repositories/usersRepository.js'
import { type RegisterInput, type LoginInput } from '../schemas/authSchemas.js'
import { type PublicUser } from '../types/user.js'
import argon2 from 'argon2'
import { signAccessToken } from '../lib/tokens.js'
import { refreshTokensRepository } from '../repositories/refreshTokenRepository.js'
import { randomBytes, createHash } from 'node:crypto'

function generateRefreshToken(): string {
	return randomBytes(32).toString('hex')
}

function hashToken(raw: string): string {
	return createHash('sha256').update(raw).digest('hex')
}

type TokenPair = { accessToken: string; refreshToken: string }

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000

function isUniqueViolation(err: unknown): boolean {
	return err instanceof Error && 'cause' in err && typeof err.cause === 'object' && err.cause !== null && 'code' in err.cause && err.cause.code === '23505'
}

export const authService = {
	async register(input: RegisterInput): Promise<PublicUser> {
		const passwordHash = await argon2.hash(input.password)

		try {
			const user = await usersRepository.create(input.email, passwordHash)
			const { passwordHash: _omit, ...publicUser } = user

			return publicUser
		} catch (err) {
			if (isUniqueViolation(err)) {
				throw new ConflictError('Email already registered')
			}
			throw err
		}
	},
	async login(input: LoginInput): Promise<TokenPair> {
		const user = await usersRepository.findByEmail(input.email)
		if (!user) {
			throw new UnauthorizedError('Invalid credentials')
		}

		const passwordOk = await argon2.verify(user.passwordHash, input.password)

		if (!passwordOk) {
			throw new UnauthorizedError('Invalid credentials')
		}

		const accessToken = signAccessToken(user)
		const refreshToken = generateRefreshToken()
		const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
		await refreshTokensRepository.create(user.id, hashToken(refreshToken), expiresAt)

		return { accessToken, refreshToken }
	},
	async logout(rawToken: string): Promise<void> {
		const stored = await refreshTokensRepository.findByHash(hashToken(rawToken))
		if (stored) await refreshTokensRepository.revoke(stored.id)
	},

	async refresh(rawToken: string): Promise<TokenPair> {
		const stored = await refreshTokensRepository.findByHash(hashToken(rawToken))

		if (!stored) throw new UnauthorizedError('Invalid refresh token')

		if (stored.revokedAt) {
			await refreshTokensRepository.revokeAllForUser(stored.userId)
			throw new UnauthorizedError('Invalid refresh token')
		}

		if (stored.expiresAt < new Date()) {
			throw new UnauthorizedError('Refresh token expired')
		}

		await refreshTokensRepository.revoke(stored.id)

		const user = await usersRepository.findById(stored.userId)
		if (!user) throw new UnauthorizedError('Invalid refresh token')

		const accessToken = signAccessToken(user)
		const refreshToken = generateRefreshToken()
		const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
		await refreshTokensRepository.create(user.id, hashToken(refreshToken), expiresAt)

		return { accessToken, refreshToken }
	},
}
