import { isNull, and, eq } from 'drizzle-orm'
import { db, type DbOrTx } from '../db/index.js'
import { refreshTokens } from '../db/schema.js'

type RefreshTokenRow = typeof refreshTokens.$inferSelect

export const refreshTokensRepository = {
	async create(userId: number, tokenHash: string, expiresAt: Date, executor: DbOrTx = db): Promise<RefreshTokenRow> {
		const rows = await executor.insert(refreshTokens).values({ userId, tokenHash, expiresAt }).returning()
		return rows[0]!
	},

	async findByHash(tokenHash: string, executor: DbOrTx = db): Promise<RefreshTokenRow | undefined> {
		const rows = await executor.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).for('update')
		return rows[0]
	},

	async revoke(id: number, executor: DbOrTx = db): Promise<void> {
		await executor.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id))
	},

	async revokeAllForUser(userId: number, executor: DbOrTx = db): Promise<void> {
		await executor
			.update(refreshTokens)
			.set({ revokedAt: new Date() })
			.where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
	},
}
