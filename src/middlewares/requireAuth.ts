import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config.js'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
	const header = req.headers.authorization

	if (!header?.startsWith('Bearer ')) {
		res.status(401).json({ error: 'Missing or malformed token' })
		return
	}

	const token = header.slice('Bearer '.length)

	try {
		const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload
		req.user = { id: Number(payload.sub), role: String(payload.role) }
		next()
	} catch {
		res.status(401).json({ error: 'Invalid or expired token' })
	}
}
