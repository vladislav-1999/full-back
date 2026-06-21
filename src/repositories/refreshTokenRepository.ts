import { isNull, and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { refreshTokens } from '../db/schema.js'

type RefreshTokenRow = typeof refreshTokens.$inferSelect

export const refreshTokensRepository = {
	async create(userId: number, tokenHash: string, expiresAt: Date): Promise<RefreshTokenRow> {
		const rows = await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt }).returning()
		return rows[0]!
	},

	async findByHash(tokenHash: string): Promise<RefreshTokenRow | undefined> {
		const rows = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash))
		return rows[0]
	},

	async revoke(id: number): Promise<void> {
		await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id))
	},

	async revokeAllForUser(userId: number): Promise<void> {
		await db
			.update(refreshTokens)
			.set({ revokedAt: new Date() })
			.where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
	},
}
