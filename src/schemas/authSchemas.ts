import { z } from 'zod'

export const registerSchema = z.object({
	email: z.email().toLowerCase().min(1).max(255),
	password: z.string().min(8).max(128),
})

export const loginSchema = z.object({
	email: z.email().toLowerCase().min(1).max(255),
	password: z.string(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
