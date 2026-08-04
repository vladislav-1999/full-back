import rateLimit from 'express-rate-limit'
import { env } from '../config.js'

export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: env.RATE_LIMIT_API,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { error: 'Too many requests' },
})

export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: env.RATE_LIMIT_LOGIN,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	skipSuccessfulRequests: true,
	requestWasSuccessful: (_req, res) => res.statusCode < 400 || res.statusCode >= 500,
	message: { error: 'Too many login attempts' },
})

export const registerLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: env.RATE_LIMIT_REGISTER,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	skipFailedRequests: true,
	requestWasSuccessful: (_req, res) => res.statusCode < 500,
	message: { error: 'Too many accounts created' },
})
