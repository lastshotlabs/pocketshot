import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'sdk',
          include: ['tests/**/*.test.ts'],
          environment: 'node',
          globals: false,
        },
      },
      {
        test: {
          name: 'ui',
          include: ['src/ui/**/__tests__/**/*.test.tsx'],
          environment: 'node',
          globals: true,
          setupFiles: ['tests/ui/setup.ts'],
          alias: {
            '@ui-test': path.resolve(__dirname, 'tests/ui'),
          },
        },
      },
    ],
  },
})
