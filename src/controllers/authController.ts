import { handleErrors } from './handleErrors.js'
import { authService } from '../services/authService.js'
import type { RegisterInput, LoginInput, RefreshInput } from '../schemas/authSchemas.js'

export const authController = {
	register: handleErrors<Record<string, string>, RegisterInput>(async (req, res) => {
		const input = req.body
		res.status(201).json(await authService.register(input))
	}),
	login: handleErrors<Record<string, string>, LoginInput>(async (req, res) => {
		const input = req.body
		res.status(200).json(await authService.login(input))
	}),
	refresh: handleErrors<Record<string, string>, RefreshInput>(async (req, res) => {
		const { refreshToken } = req.body
		res.status(200).json(await authService.refresh(refreshToken))
	}),
	logout: handleErrors<Record<string, string>, RefreshInput>(async (req, res) => {
		const { refreshToken } = req.body
		await authService.logout(refreshToken)
		res.status(204).end()
	}),
}
