export type HttpErrorResponse = { status: number; message: string }

const CLIENT_MESSAGES: Record<number, string> = {
	400: 'Invalid JSON',
	413: 'Payload too large',
}

export function toHttpError(err: unknown): HttpErrorResponse {
	const raw = (err as { status?: unknown } | null | undefined)?.status
	const status = typeof raw === 'number' && raw >= 400 && raw < 500 ? raw : 500

	return { status, message: CLIENT_MESSAGES[status] ?? 'Internal server error' }
}

export function asError(err: unknown): Error {
	return err instanceof Error ? err : new Error(String(err))
}
