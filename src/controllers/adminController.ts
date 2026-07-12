import { usersService } from '../services/usersService.js'
import { handleErrors } from './handleErrors.js'

export const adminController = {
	listUsers: handleErrors(async (_req, res) => {
		res.json(await usersService.listUsers())
	}),
}
