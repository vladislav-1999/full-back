import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globalSetup: ['./vitest.globalSetup.ts'],
		setupFiles: ['./vitest.setup.ts'],
		coverage: {
			include: ['src/**/*.ts'],
			reporter: ['text'],
			exclude: ['src/**/*.test.ts', 'src/docs/**', 'src/types/**', 'src/db/schema.ts', 'src/config.ts', 'src/lib/logger.ts'],
			thresholds: {
				statements: 90,
				branches: 90,
				functions: 90,
				lines: 90,
			},
		},
	},
})
