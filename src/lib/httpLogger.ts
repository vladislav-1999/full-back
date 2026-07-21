import { pinoHttp, type Options } from 'pino-http'
import { randomUUID } from 'node:crypto'
import { logger } from './logger.js'

const REQUEST_ID_HEADER = 'x-request-id'

export const genReqId: NonNullable<Options['genReqId']> = (req, res) => {
	const existing = req.headers[REQUEST_ID_HEADER]

	if (typeof existing === 'string' && existing.length <= 64 && /^[\w-]+$/.test(existing)) {
		return existing
	}

	const id = randomUUID()

	res.setHeader(REQUEST_ID_HEADER, id)

	return id
}

export const customLogLevel: NonNullable<Options['customLogLevel']> = (_req, res, err) => {
	if (err || res.statusCode >= 500) return 'error'
	if (res.statusCode >= 400) return 'warn'
	return 'info'
}
export const httpLogger = pinoHttp({
	logger,
	genReqId,
	customLogLevel,
	autoLogging: {
		ignore: (req) => req.url?.startsWith('/docs') ?? false,
	},
})
