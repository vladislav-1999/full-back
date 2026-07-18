import jwt from 'jsonwebtoken'
import { env } from '../config.js'

export function signAccessToken(user: { id: number; role: string }): string {
	return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '15m' })
}
