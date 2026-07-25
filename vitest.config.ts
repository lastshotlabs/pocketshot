import { defineConfig } from 'vitest/config'
import path from 'path'

const packageSourceAliases = {
  '@lastshotlabs/pocketshot/ai': path.resolve(__dirname, 'src/ai/index.ts'),
  '@lastshotlabs/pocketshot/audio': path.resolve(__dirname, 'src/audio/index.ts'),
  '@lastshotlabs/pocketshot/billing': path.resolve(__dirname, 'src/billing/index.ts'),
  '@lastshotlabs/pocketshot/coach': path.resolve(__dirname, 'src/coach/index.ts'),
  '@lastshotlabs/pocketshot/party': path.resolve(__dirname, 'src/party/index.ts'),
  '@lastshotlabs/pocketshot/party-session': path.resolve(__dirname, 'src/party-session/index.ts'),
  '@lastshotlabs/pocketshot/release': path.resolve(__dirname, 'src/release/index.ts'),
  '@lastshotlabs/pocketshot/observability': path.resolve(__dirname, 'src/observability/index.ts'),
  '@lastshotlabs/pocketshot/accessibility': path.resolve(__dirname, 'src/accessibility/index.ts'),
  '@lastshotlabs/pocketshot/community': path.resolve(__dirname, 'src/community/index.ts'),
  '@lastshotlabs/pocketshot/drafts': path.resolve(__dirname, 'src/drafts/index.ts'),
  '@lastshotlabs/pocketshot/media': path.resolve(__dirname, 'src/media/index.ts'),
  '@lastshotlabs/pocketshot/realtime': path.resolve(__dirname, 'src/realtime/index.ts'),
}

export default defineConfig({
  resolve: {
    alias: packageSourceAliases,
  },
  test: {
    projects: [
      {
        resolve: {
          alias: packageSourceAliases,
        },
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
