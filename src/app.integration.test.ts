import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { sql, eq, isNull } from 'drizzle-orm'
import { users, refreshTokens } from './db/schema.js'
import app from './app.js'
import { db } from './db/index.js'

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

async function signupAndLogin(email: string): Promise<{ accessToken: string; refreshToken: string }> {
	const password = '12345678'

	await request(app).post('/auth/register').send({ email, password }).expect(201)

	const res = await request(app).post('/auth/login').send({ email, password }).expect(200)

	return res.body
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
	it('register -> login -> create -> list -> patch -> delete: полный CRUD своих задач', async () => {
		const { accessToken } = await signupAndLogin('alice@example.com')
		const created = await request(app).post('/tasks').set('Authorization', `Bearer ${accessToken}`).send({ title: 'купить кофе' }).expect(201)

		expect(created.body).toMatchObject({ title: 'купить кофе', done: false })
		expect(created.body).not.toHaveProperty('userId')

		const list = await request(app).get('/tasks').set('Authorization', `Bearer ${accessToken}`).expect(200)

		expect(list.body).toHaveLength(1)
		expect(list.body[0]).toMatchObject({ id: created.body.id, title: 'купить кофе' })

		const patched = await request(app).patch(`/tasks/${created.body.id}`).set('Authorization', `Bearer ${accessToken}`).send({ done: true }).expect(200)

		expect(patched.body).toMatchObject({ id: created.body.id, title: 'купить кофе', done: true })

		await request(app).delete(`/tasks/${created.body.id}`).set('Authorization', `Bearer ${accessToken}`).expect(204)
		await request(app).get(`/tasks/${created.body.id}`).set('Authorization', `Bearer ${accessToken}`).expect(404)
	})

	it('IDOR: чужая задача недоступна на чтение/измененние/удаление -> 404', async () => {
		const { accessToken: aliceToken } = await signupAndLogin('alice@example.com')
		const { accessToken: bobToken } = await signupAndLogin('bob@example.com')

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

describe('refresh + logout (integration)', () => {
	it('ротация: refresh -> новая пара; reuse старого -> 401 + каскадный отзыв', async () => {
		const { refreshToken: r0 } = await signupAndLogin('rotate@example.com')

		const res1 = await request(app).post('/auth/refresh').send({ refreshToken: r0 }).expect(200)
		const r1: string = res1.body.refreshToken

		expect(res1.body).toMatchObject({ accessToken: expect.any(String), refreshToken: expect.any(String) })
		expect(r1).not.toBe(r0)

		await request(app).post('/auth/refresh').send({ refreshToken: r0 }).expect(401)
		await request(app).post('/auth/refresh').send({ refreshToken: r1 }).expect(401)
	})

	it('logout: 204 -> токен мертв -> повторный logout идемпотентен', async () => {
		const { refreshToken } = await signupAndLogin('logout@example.com')

		await request(app).post('/auth/logout').send({ refreshToken }).expect(204)
		await request(app).post('/auth/refresh').send({ refreshToken }).expect(401)
		await request(app).post('/auth/logout').send({ refreshToken }).expect(204)
		await request(app).post('/auth/logout').send({ refreshToken: 'never-existed' }).expect(204)
	})

	it('параллельный refresh одним токеном: ровно один 200, второй 401', async () => {
		const { refreshToken: r0 } = await signupAndLogin('race@example.com')
		const [a, b] = await Promise.all([
			request(app).post('/auth/refresh').send({ refreshToken: r0 }),
			request(app).post('/auth/refresh').send({ refreshToken: r0 }),
		])

		expect([a.status, b.status].sort()).toEqual([200, 401])

		const alive = await db.select().from(refreshTokens).where(isNull(refreshTokens.revokedAt))

		expect(alive).toHaveLength(0)
	})

	it('просроченный refresh -> 401 Refresh token expired, каскадный отзыв не срабатывает', async () => {
		const { refreshToken } = await signupAndLogin('expired@example.com')

		await db.update(refreshTokens).set({ expiresAt: new Date(Date.now() - 1000) })

		const res = await request(app).post('/auth/refresh').send({ refreshToken }).expect(401)

		expect(res.body).toMatchObject({ error: 'Refresh token expired' })

		const rows = await db.select().from(refreshTokens)

		expect(rows).toHaveLength(1)
		expect(rows[0]!.revokedAt).toBeNull()
	})
	it('ротация атомарна: после refresh ровно один живой токен, старый отозван', async () => {
		const { refreshToken: r0 } = await signupAndLogin('atomic@example.com')

		await request(app).post('/auth/refresh').send({ refreshToken: r0 }).expect(200)

		const rows = await db.select().from(refreshTokens).orderBy(refreshTokens.id)

		expect(rows).toHaveLength(2)
		expect(rows.filter((r) => r.revokedAt === null)).toHaveLength(1)
		expect(rows[0]!.revokedAt).not.toBeNull()
		expect(rows[1]!.revokedAt).toBeNull()
	})
})

async function signupAdminAndLogin(email: string): Promise<{ accessToken: string }> {
	const password = '12345678'

	await request(app).post('/auth/register').send({ email, password }).expect(201)
	await db.update(users).set({ role: 'admin' }).where(eq(users.email, email))

	const res = await request(app).post('/auth/login').send({ email, password }).expect(200)

	return res.body
}

describe('RBAC: GET /admin/users (requireAuth+ requireRole)', () => {
	it('Без токена -> 401 (обрыв на requireAuth), до requireRole не дошло', async () => {
		const res = await request(app).get('/admin/users').expect(401)

		expect(res.body).toMatchObject({ error: 'Missing or malformed token' })
	})

	it('валидный токен обычного юзера -> 403 Forbidden (AuthN прошла, AuthZ - нет', async () => {
		const { accessToken } = await signupAndLogin('plain@example.com')
		const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${accessToken}`).expect(403)

		expect(res.body).toMatchObject({ error: 'Forbidden' })
	})

	it('admin -> 200 + список юзеров без passwordHash', async () => {
		await signupAndLogin('plain@example.com')

		const { accessToken } = await signupAdminAndLogin('boss@example.com')
		const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${accessToken}`).expect(200)

		expect(res.body).toHaveLength(2)

		for (const user of res.body) {
			expect(user).not.toHaveProperty('passwordHash')
		}

		expect(res.body).toContainEqual(expect.objectContaining({ email: 'boss@example.com', role: 'admin' }))
		expect(res.body).toContainEqual(expect.objectContaining({ email: 'plain@example.com', role: 'user' }))
	})
})

describe('GET /admin/users: агрегаты по задачам (LEFT JOIN + GROUP BY)', () => {
	it('считает задачи каждого юзера; юзер без задач -> 0/0', async () => {
		await signupAndLogin('nobody@example.com')

		const { accessToken } = await signupAdminAndLogin('boss@example.com')
		const auth = { Authorization: `Bearer ${accessToken}` }
		const first = await request(app).post('/tasks').set(auth).send({ title: 'Первая' }).expect(201)

		await request(app).post('/tasks').set(auth).send({ title: 'Вторая' }).expect(201)
		await request(app).patch(`/tasks/${first.body.id}`).set(auth).send({ done: true }).expect(200)

		const res = await request(app).get('/admin/users').set(auth).expect(200)

		expect(res.body).toContainEqual(expect.objectContaining({ email: 'boss@example.com', tasksCount: 2, doneCount: 1 }))
		expect(res.body).toContainEqual(expect.objectContaining({ email: 'nobody@example.com', tasksCount: 0, doneCount: 0 }))
		expect(res.body.map((u: { email: string }) => u.email)).toEqual(['nobody@example.com', 'boss@example.com'])
	})
})

describe('сквозные заголовки (helmet)', () => {
	it('не раскрывает фреймворк и ставит защитные заголовки', async () => {
		const res = await request(app).get('/health')

		expect(res.status).toBe(200)

		expect(res.headers['x-powered-by']).toBeUndefined()

		expect(res.headers['x-content-type-options']).toBe('nosniff')
	})
})
