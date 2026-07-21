import { describe, it, expect, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { genReqId, customLogLevel } from './httpLogger.js'

const makeReq = (headers: Record<string, string> = {}) => ({ headers }) as unknown as IncomingMessage

const makeRes = (statusCode = 200) => {
	const setHeader = vi.fn()
	return { res: { statusCode, setHeader } as unknown as ServerResponse, setHeader }
}

describe('genReqId', () => {
	it('принимает валидный x-request-id из заголовка (сквозная трассировка)', () => {
		const { res, setHeader } = makeRes()

		const id = genReqId(makeReq({ 'x-request-id': 'abc-123' }), res)

		expect(id).toBe('abc-123')
		expect(setHeader).not.toHaveBeenCalled()
	})

	it('генерирует UUID, если заголовка нет, и отдаёт его в ответе', () => {
		const { res, setHeader } = makeRes()

		const id = genReqId(makeReq(), res)

		expect(id).toEqual(expect.stringMatching(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/))
		expect(setHeader).toHaveBeenCalledWith('x-request-id', id)
	})

	it('отвергает мусорный id и генерирует свой', () => {
		const cases = ['a'.repeat(65), '../../etc/passwd', 'id with spaces']

		for (const bad of cases) {
			const { res } = makeRes()
			const id = genReqId(makeReq({ 'x-request-id': bad }), res)
			expect(id).not.toBe(bad)
		}
	})
})

describe('customLogLevel', () => {
	it('2xx -> info', () => {
		expect(customLogLevel(makeReq(), makeRes(200).res, undefined)).toBe('info')
	})

	it('4xx -> warn', () => {
		expect(customLogLevel(makeReq(), makeRes(404).res, undefined)).toBe('warn')
	})

	it('5xx -> error', () => {
		expect(customLogLevel(makeReq(), makeRes(500).res, undefined)).toBe('error')
	})

	it('ошибка при успешном статусе всё равно error', () => {
		expect(customLogLevel(makeReq(), makeRes(200).res, new Error('boom'))).toBe('error')
	})
})
