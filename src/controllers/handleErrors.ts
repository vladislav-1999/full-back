import type { Request, Response, RequestHandler } from 'express'
import { NotFoundError, ConflictError } from '../errors.js'

export function handleErrors(fn: (req: Request, res: Response) => void | Promise<void>): RequestHandler {
	return async (req, res) => {
		try {
			await fn(req, res)
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({ error: err.message })
				return
			}
			if (err instanceof ConflictError) {
				res.status(409).json({ error: err.message })
				return
			}
			console.error(err)
			res.status(500).json({ error: 'Internal server error' })
		}
	}
}
