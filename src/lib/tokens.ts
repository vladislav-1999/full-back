import jwt from 'jsonwebtoken'

export function signAccessToken(user: { id: number; role: string }): string {
	return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '15m' })
}
