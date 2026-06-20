import { z } from 'zod'
import '../schemas/authSchemas.js'
import '../schemas/taskSchemas.js'

const generated = z.toJSONSchema(z.globalRegistry, {
	target: 'openapi-3.0',
	io: 'input',
	uri: (id) => `#/components/schemas/${id}`,
})

const components = {
	schemas: generated.schemas,
	securitySchemes: {
		bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
	},
}

export const openapiDocument = {
	openapi: '3.0.3',
	info: { title: 'Todo API', version: '1.0.0' },
	paths: {
		'/auth/register': {
			post: {
				tags: ['Auth'],
				summary: 'Регистрация пользователя',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/RegisterInput' },
						},
					},
				},
				responses: {
					'201': {
						description: 'Пользователь создан',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/PublicUser' },
							},
						},
					},
					'400': { description: 'Validation error' },
					'409': { description: 'Email is already registered' },
				},
			},
		},
		'/auth/login': {
			post: {
				tags: ['Auth'],
				summary: 'Вход (получение JWT)',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/LoginInput' },
						},
					},
				},
				responses: {
					'200': {
						description: 'Успешный вход',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: { token: { type: 'string' } },
								},
							},
						},
					},
					'400': { description: 'Validation error' },
					'401': { description: 'Invalid credentials' },
				},
			},
		},
		'/tasks': {
			get: {
				tags: ['Tasks'],
				summary: 'Все задачи',
				security: [{ bearerAuth: [] }],
				responses: {
					'200': {
						description: 'Список задач',
						content: {
							'application/json': {
								schema: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
							},
						},
					},
					'401': { description: 'Missing or malformed token' },
				},
			},
			post: {
				tags: ['Tasks'],
				summary: 'Добавить задачу',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTaskInput' } } },
				},
				security: [{ bearerAuth: [] }],
				responses: {
					'201': { description: 'Создана', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
					'400': { description: 'Validation error' },
					'401': { description: 'Missing or malformed token' },
				},
			},
		},
		'/tasks/{id}': {
			get: {
				tags: ['Tasks'],
				summary: 'Конкретная задача',
				security: [{ bearerAuth: [] }],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
				responses: {
					'200': { description: 'Задача', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
					'401': { description: 'Missing or malformed token' },
					'404': { description: 'Not found' },
				},
			},
			patch: {
				tags: ['Tasks'],
				summary: 'Изменить задачу',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTaskInput' } } },
				},
				security: [{ bearerAuth: [] }],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
				responses: {
					'200': { description: 'Задача изменена', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
					'400': { description: 'Validation error' },
					'401': { description: 'Missing or malformed token' },
					'404': { description: 'Not found' },
				},
			},
			delete: {
				tags: ['Tasks'],
				summary: 'Удалить задачу',
				security: [{ bearerAuth: [] }],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
				responses: {
					'204': { description: 'Задача удалена' },
					'401': { description: 'Missing or malformed token' },
					'404': { description: 'Not found' },
				},
			},
		},
	},
	components,
}
