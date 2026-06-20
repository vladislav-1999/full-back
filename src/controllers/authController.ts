import { handleErrors } from './handleErrors.js'
import { authService } from '../services/authService.js'
import type { RegisterInput, LoginInput } from '../schemas/authSchemas.js'

export const authController = {
	register: handleErrors<Record<string, string>, RegisterInput>(async (req, res) => {
		const input = req.body
		res.status(201).json(await authService.register(input))
	}),
	login: handleErrors<Record<string, string>, LoginInput>(async (req, res) => {
		const input = req.body
		res.status(200).json(await authService.login(input))
	}),
}
