import { describe, it, expect } from 'vitest'
import { errSerializer } from './logger.js'

const EMAIL = 'victim@test.dev'
const HASH = '$argon2id$v=19$m=65536,t=3,p=4$SALTSALTSALT$HASHHASHHASH'

function makeDrizzleError(): Error {
	const cause = new Error('relation "users" does not exist')

	const err = new Error(`Failed query: insert into "users" ("email", "password_hash") values ($1, $2)\nparams: ${EMAIL}, ${HASH}`, { cause })

	Object.assign(err, {
		query: 'insert into "users" ("email", "password_hash") values ($1, $2)',
		params: [EMAIL, HASH],
	})

	return err
}

describe('errSerializer', () => {
	it('не выпускает значения параметров запроса в лог', () => {
		const serialized = errSerializer(makeDrizzleError())

		const asText = JSON.stringify(serialized)

		expect(asText).not.toContain(EMAIL)
		expect(asText).not.toContain(HASH)
	})

	it('сохраняет диагностическую ценность записи', () => {
		const serialized = errSerializer(makeDrizzleError())

		expect(serialized.query).toContain('insert into "users"')
		expect(serialized.params).toBeUndefined()
		expect(serialized.message).toContain('Failed query')
		expect(serialized.message).toContain('[Redacted]')
	})
})
