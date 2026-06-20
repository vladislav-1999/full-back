import { z } from 'zod'

export const taskSchema = z
	.object({
		id: z.number().int().positive(),
		title: z.string().trim().min(1).max(200),
		done: z.boolean(),
	})
	.meta({ id: 'Task' })

export const createTaskSchema = taskSchema.pick({ title: true }).meta({ id: 'CreateTaskInput' })

export const updateTaskSchema = taskSchema.pick({ done: true }).partial().meta({ id: 'UpdateTaskInput' })

export const taskIdParamSchema = z.object({
	id: z.coerce.number().int().positive(),
})

export type TaskIdParam = z.infer<typeof taskIdParamSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
