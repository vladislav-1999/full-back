import { describe, it, expect } from 'vitest'

// Санити на окружение: тесты обязаны видеть ТЕСТОВУЮ базу, а не dev.
// Если этот тест красный — значит подмена env не отработала, и любой тест с БД
// молча стёр бы данные разработки. Поэтому проверяем это отдельным явным тестом.
describe('test environment', () => {
	it('DATABASE_URL указывает на todo_test', () => {
		// регулярка на конец строки: URL должен оканчиваться на /todo_test, а не /todo_db
		expect(process.env.DATABASE_URL).toMatch(/\/todo_test$/)
	})

	it('JWT_SECRET задан', () => {
		// requireAuth и signAccessToken упадут без секрета — проверяем, что он есть
		expect(process.env.JWT_SECRET).toBeTruthy()
	})
})
