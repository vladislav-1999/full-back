import app from './src/app.js'
import { env } from './src/config.js'
import { logger } from './src/lib/logger.js'
import { db } from './src/db/index.js'

const server = app.listen(env.PORT, () => {
	logger.info({ port: env.PORT }, 'Server started')
})

let shuttingDown = false

const shutdown = (signal: NodeJS.Signals) => {
	if (shuttingDown) return
	shuttingDown = true

	logger.info({ signal }, 'Shutdown started')

	const forceExit = setTimeout(() => {
		logger.error('Graceful shutdown timed out, forcing exit')
		process.exit(1)
	}, 10_000)
	forceExit.unref()

	server.close((err) => {
		if (err) {
			logger.error({ err }, 'HTTP server close failed')
			process.exit(1)
		}

		db.$client
			.end()
			.then(() => {
				logger.info('Shutdown complete')
				process.exit(0)
			})
			.catch((err: unknown) => {
				logger.error({ err }, 'DB pool close failed')
				process.exit(1)
			})
	})

	server.closeIdleConnections()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
