import { handleErrors } from './handleErrors.js'
import { type RegisterInput } from '../schemas/authSchemas.js'
import { authService } from '../services/authService.js'

export const authController = {
	register: handleErrors(async (req, res) => {
		const input = req.body as RegisterInput
		res.status(201).json(await authService.register(input))
	}),
}
