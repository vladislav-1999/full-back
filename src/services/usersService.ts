import { usersRepository } from '../repositories/usersRepository.js'
import type { UserWithStats } from '../types/user.js'

export const usersService = {
	async listUsers(): Promise<UserWithStats[]> {
		return usersRepository.findAll()
	},
}
