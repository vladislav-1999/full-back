import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { type ZodType } from 'zod'

type Source = 'body' | 'params' | 'query'

export function validate(schema: ZodType, source: Source = 'body'): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req[source])

		if (!result.success) {
			const error = result.error

			res.status(400).json({
				error: 'Validation failed',
				issues: error.issues.map((i) => ({
					path: i.path.join('.'),
					message: i.message,
				})),
			})
			return
		}
		req[source] = result.data
		next()
	}
}
