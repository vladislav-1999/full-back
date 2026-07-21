import type { Request, Response, RequestHandler } from 'express'
import { NotFoundError, ConflictError, UnauthorizedError } from '../errors.js'

export function handleErrors<P = Record<string, string>, ReqBody = unknown>(
	fn: (req: Request<P, unknown, ReqBody>, res: Response) => void | Promise<void>,
): RequestHandler {
	return async (req, res) => {
		try {
			await fn(req as Request<P, unknown, ReqBody>, res)
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({ error: err.message })
				return
			}
			if (err instanceof ConflictError) {
				res.status(409).json({ error: err.message })
				return
			}
			if (err instanceof UnauthorizedError) {
				res.status(401).json({ error: err.message })
				return
			}
			res.err = err instanceof Error ? err : new Error(String(err))
			res.status(500).json({ error: 'Internal server error' })
		}
	}
}
