import { describe, it, expect } from 'vitest'
import { isShuttingDown, markShuttingDown } from './serverState.js'

describe('serverState', () => {
	it('по умолчанию false, после markShuttingDown становится true и обратно не возвращается', () => {
		expect(isShuttingDown()).toBe(false)

		markShuttingDown()

		expect(isShuttingDown()).toBe(true)

		markShuttingDown()
		expect(isShuttingDown()).toBe(true)
	})
})
