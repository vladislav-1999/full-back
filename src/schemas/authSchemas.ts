import { z } from 'zod'

export const registerSchema = z
	.object({
		email: z.email().toLowerCase().min(1).max(255),
		password: z.string().min(8).max(128),
	})
	.meta({ id: 'RegisterInput' })

export const loginSchema = z
	.object({
		email: z.email().toLowerCase().min(1).max(255),
		password: z.string(),
	})
	.meta({ id: 'LoginInput' })

export const publicUserSchema = z
	.object({
		id: z.number().int(),
		email: z.email(),
		role: z.string(),
		createdAt: z.string(),
	})
	.meta({ id: 'PublicUser' })

export const refreshSchema = z
	.object({
		refreshToken: z.string().min(1),
	})
	.meta({ id: 'RefreshInput' })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
