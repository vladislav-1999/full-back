import { usersRepository } from '../repositories/usersRepository.js'
import type { PublicUser } from '../types/user.js'

export const usersService = {
	async listUsers(): Promise<PublicUser[]> {
		return usersRepository.findAll()
	},
}
