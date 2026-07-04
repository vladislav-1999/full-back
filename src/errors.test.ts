import { describe, it, expect } from 'vitest'
import { ConflictError } from './errors.js'

describe('domain errors', () => {
	it('ConflictError', () => {
		const err = new ConflictError('Email already registered')
		expect(err).toBeInstanceOf(Error)
		expect(err.message).toBe('Email already registered')
		expect(err.name).toBe('ConflictError')
	})
})
