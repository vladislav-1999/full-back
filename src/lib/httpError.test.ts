import { describe, it, expect } from 'vitest'
import { toHttpError, asError } from './httpError.js'

describe('toHttpError', () => {
	it('413 от body-parser -> свой код и текст', () => {
		expect(toHttpError({ status: 413 })).toEqual({ status: 413, message: 'Payload too large' })
	})

	it('400 от body-parser -> свой код и текст', () => {
		expect(toHttpError({ status: 400 })).toEqual({ status: 400, message: 'Invalid JSON' })
	})

	it('4xx без своего текста -> код сохраняем, текст обезличиваем', () => {
		expect(toHttpError({ status: 404 })).toEqual({ status: 404, message: 'Internal server error' })
	})

	it('5xx от чужого middleware -> отдаём СВОЙ 500, чужому коду не доверяем', () => {
		expect(toHttpError({ status: 503 })).toEqual({ status: 500, message: 'Internal server error' })
	})

	it('обычная Error без status -> 500', () => {
		expect(toHttpError(new Error('boom'))).toEqual({ status: 500, message: 'Internal server error' })
	})

	it('status не число -> 500 (не доверяем форме чужого объекта)', () => {
		expect(toHttpError({ status: '413' })).toEqual({ status: 500, message: 'Internal server error' })
	})

	it('бросили не объект -> 500, без падения', () => {
		expect(toHttpError('строка')).toEqual({ status: 500, message: 'Internal server error' })
		expect(toHttpError(null)).toEqual({ status: 500, message: 'Internal server error' })
		expect(toHttpError(undefined)).toEqual({ status: 500, message: 'Internal server error' })
	})
})

describe('asError', () => {
	it('Error проходит как есть (стек сохраняется)', () => {
		const original = new Error('boom')
		expect(asError(original)).toBe(original)
	})

	it('не-Error оборачивается', () => {
		const wrapped = asError('строка')
		expect(wrapped).toBeInstanceOf(Error)
		expect(wrapped.message).toBe('строка')
	})
})
