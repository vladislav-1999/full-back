export interface User {
	id: number
	email: string
	passwordHash: string
	role: string
	createdAt: Date
}

export type UserWithStats = PublicUser & {
	tasksCount: number
	doneCount: number
}

export type PublicUser = Omit<User, 'passwordHash'>
