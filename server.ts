import app from './src/app.js'
import { env } from './src/config.js'
import { logger } from './src/lib/logger.js'

app.listen(env.PORT, () => {
	logger.info({ port: env.PORT }, 'Server started')
})
