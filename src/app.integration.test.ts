import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { sql, eq } from 'drizzle-orm'
import app from './app.js'
import { db } from './db/index.js'
import { users } from './db/schema.js'

beforeEach(async () => {
	await db.execute(sql`TRUNCATE tasks, users, refresh_tokens RESTART IDENTITY CASCADE`)
})

afterAll(async () => {
	await db.$client.end()
})

describe('POST /auth/register (integration)', () => {
	it('Валидные данные -> 201 + PublicUser (без хэша) + реальная строка в БД', async () => {
		const email = 'new@example.com'

		const res = await request(app).post('/auth/register').send({ email, password: '12345678' })

		expect(res.status).toBe(201)
		expect(res.body).toMatchObject({ email, role: 'user' })
		expect(res.body).toHaveProperty('id')
		expect(res.body).not.toHaveProperty('passwordHash')

		const rows = await db.select().from(users).where(eq(users.email, email))

		expect(rows).toHaveLength(1)
		expect(rows[0]!.passwordHash).not.toBe('12345678')
		expect(rows[0]!.passwordHash).toMatch(/^\$argon2/)
	})

	it('Дубль email -> 409 (ловит УНИКАЛЬНЫЙ индекс в БД, а не проверку в коде)', async () => {
		const creds = { email: 'dub@example.com', password: '12345678' }
		await request(app).post('/auth/register').send(creds).expect(201)
		await request(app).post('/auth/register').send(creds).expect(409)
	})

	it('невалидное тело -> 400 от Zod (middleware validate, до контроллера', async () => {
		const res = await request(app).post('/auth/register').send({ email: 'not-an-email', password: '123' })

		expect(res.status).toBe(400)
		expect(res.body).toMatchObject({ error: 'Validation failed' })
		expect(Array.isArray(res.body.issues)).toBe(true)
	})
})

async function signupAndLogin(email: string): Promise<string> {
	const password = '12345678'

	await request(app).post('/auth/register').send({ email, password }).expect(201)

	const res = await request(app).post('/auth/login').send({ email, password }).expect(200)

	return res.body.accessToken
}

describe('защита /tasks (requireAuth)', () => {
	it('без токена -> 401', async () => {
		await request(app).get('/tasks').expect(401)
	})

	it('битый токен -> 401 (jwt.verify боосил, middleware ответил сам, не 500)', async () => {
		await request(app).get('/tasks').set('Authorization', 'Bearer garbage.not.jwt').expect(401)
	})
})

describe('полный поток + IDOR (integration)', () => {
	it('register -> login -> create -> list: юзер работает со своими задачами', async () => {
		const token = await signupAndLogin('alice@example.com')
		const created = await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'купить кофе' }).expect(201)

		expect(created.body).toMatchObject({ title: 'купить кофе', done: false })
		expect(created.body).not.toHaveProperty('userId')

		const list = await request(app).get('/tasks').set('Authorization', `Bearer ${token}`).expect(200)

		expect(list.body).toHaveLength(1)
		expect(list.body[0]).toMatchObject({ id: created.body.id, title: 'купить кофе' })
	})

	it('IDOR: чужая задача недоступна на чтение/измененние/удаление -> 404', async () => {
		const aliceToken = await signupAndLogin('alice@example.com')
		const bobToken = await signupAndLogin('bob@example.com')

		const created = await request(app).post('/tasks').set('Authorization', `Bearer ${aliceToken}`).send({ title: 'секрет Алисы' }).expect(201)
		const taskId = created.body.id

		await request(app).get(`/tasks/${taskId}`).set('Authorization', `Bearer ${bobToken}`).expect(404)
		await request(app).patch(`/tasks/${taskId}`).set('Authorization', `Bearer ${bobToken}`).send({ done: true }).expect(404)
		await request(app).delete(`/tasks/${taskId}`).set('Authorization', `Bearer ${bobToken}`).expect(404)

		const check = await request(app).get(`/tasks/${taskId}`).set('Authorization', `Bearer ${aliceToken}`).expect(200)

		expect(check.body).toMatchObject({ id: taskId, title: 'секрет Алисы', done: false })

		const bobList = await request(app).get('/tasks').set('Authorization', `Bearer ${bobToken}`).expect(200)

		expect(bobList.body).toHaveLength(0)
	})
})
