import { pino, stdSerializers } from 'pino'
import { env } from '../config.js'

const PARAMS_LINE = /\nparams:[^\n]*/g

export const errSerializer = (err: unknown): Record<string, unknown> => sanitizeError(stdSerializers.err(err as Error) as unknown as Record<string, unknown>)

function redactParamsInText(text: string): string {
	return text.replace(PARAMS_LINE, '\nparams: [Redacted]')
}

function sanitizeError(serialized: Record<string, unknown>): Record<string, unknown> {
	const { params: _dropped, ...rest } = serialized

	if (typeof rest.message === 'string') rest.message = redactParamsInText(rest.message)
	if (typeof rest.stack === 'string') rest.stack = redactParamsInText(rest.stack)

	if (rest.cause && typeof rest.cause === 'object') {
		rest.cause = sanitizeError(rest.cause as Record<string, unknown>)
	}

	return rest
}

export const logger = pino({
	level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
	transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } : undefined,

	serializers: { err: errSerializer },

	redact: {
		paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', 'err.params', '*.params'],
		censor: '[Redacted]',
	},
})
