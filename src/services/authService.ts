import { ConflictError, UnauthorizedError } from '../errors.js'
import { usersRepository } from '../repositories/usersRepository.js'
import { type RegisterInput, type LoginInput } from '../schemas/authSchemas.js'
import { type PublicUser } from '../types/user.js'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

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
	async login(input: LoginInput): Promise<{ token: string }> {
		const user = await usersRepository.findByEmail(input.email)
		if (!user) {
			throw new UnauthorizedError('Invalid credentials')
		}

		const passwordOk = await argon2.verify(user.passwordHash, input.password)

		if (!passwordOk) {
			throw new UnauthorizedError('Invalid credentials')
		}

		const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '15m' })

		return { token }
	},
}
