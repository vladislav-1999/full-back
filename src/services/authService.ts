import { ConflictError } from '../errors.js'
import { usersRepository } from '../repositories/usersRepository.js'
import { type RegisterInput } from '../schemas/authSchemas.js'
import { type PublicUser } from '../types/user.js'
import argon2 from 'argon2'

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
}
