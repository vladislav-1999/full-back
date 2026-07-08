import { it, expect } from 'vitest'
import { registerSchema } from './authSchemas.js'

it('валидные данные приходят', () => {
	const result = registerSchema.safeParse({ email: 'user@example.com', password: '12345678' })
	expect(result.success).toBe(true)
})

it('email нормализуется в нижний регистр', () => {
	const result = registerSchema.safeParse({ email: 'USER@example.com', password: '12345678' })

	expect(result.success).toBe(true)
	if (result.success) {
		expect(result.data.email).toBe('user@example.com')
	}
})

it('невалидный email -> провал по полю email', () => {
	const result = registerSchema.safeParse({ email: 'not-an-email', password: '12345678' })

	expect(result.success).toBe(false)
	if (!result.success) {
		expect(result.error.issues.some((i) => i.path[0] === 'email')).toBe(true)
	}
})

it('пароль короче 8 -> провал по полю password', () => {
	const result = registerSchema.safeParse({ email: 'user@example.com', password: '1234567' })

	expect(result.success).toBe(false)
	if (!result.success) {
		expect(result.error.issues.some((i) => i.path[0] === 'password')).toBe(true)
	}
})

it('граница длины пароля: 8 - ok, 7 - not ok', () => {
	expect(registerSchema.safeParse({ email: 'user@example.com', password: '12345678' }).success).toBe(true)
	expect(registerSchema.safeParse({ email: 'user@example.com', password: '1234567' }).success).toBe(false)
})

it('пароль длиннее 128 -> провал', () => {
	const long = 'a'.repeat(129)
	expect(registerSchema.safeParse({ email: 'user@example.com', password: long }).success).toBe(false)
})
