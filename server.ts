import app from './src/app.js'
import { env } from './src/config.js'
import { logger } from './src/lib/logger.js'
import { db } from './src/db/index.js'
import { isShuttingDown, markShuttingDown } from './src/lib/serverState.js'

const server = app.listen(env.PORT, () => {
	logger.info({ port: env.PORT }, 'Server started')
})

const SHUTDOWN_TIMEOUT_MS = 10_000

async function shutdown(signal: NodeJS.Signals): Promise<void> {
	if (isShuttingDown()) return

	markShuttingDown()

	logger.info({ signal }, 'Shutdown started')

	const forceExit = setTimeout(() => {
		logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, 'Graceful shutdown timed out, forcing exit')
		process.exit(1)
	}, SHUTDOWN_TIMEOUT_MS)

	forceExit.unref()

	try {
		const closed = new Promise<void>((resolve, reject) => {
			server.close((err) => (err ? reject(err) : resolve()))
		})

		server.closeIdleConnections()

		await closed
		logger.info('HTTP server closed')

		await db.$client.end()
		logger.info('Database pool closed')

		clearTimeout(forceExit)

		process.exitCode = 0
	} catch (err) {
		logger.error({ err }, 'Error during shutdown')
		process.exitCode = 1
	}
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
	process.on(signal, () => void shutdown(signal))
}
