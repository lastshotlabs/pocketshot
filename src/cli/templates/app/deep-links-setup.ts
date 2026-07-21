import type { PocketshotScaffoldConfig } from '../../types'

/**
 * Generates the deep link router setup hook.
 * Placed at lib/useDeepLinks.ts in the scaffolded app.
 */
export function deepLinksSetupTemplate(config: PocketshotScaffoldConfig): string {
  return `import { useDeepLinkRouter } from '@lastshotlabs/pocketshot'
import { useRouter } from 'expo-router'

/**
 * Register your app's deep link routes here.
 * Called once in the root layout.
 *
 * Universal links (https://) work after slingshot-deep-links plugin is deployed.
 * Scheme links (${config.scheme}://) work immediately.
 */
export function useDeepLinks() {
  const router = useRouter()

  useDeepLinkRouter([
    {
      pattern: '/post/:id',
      handler: ({ id }) => router.push(\`/posts/\${id}\`),
    },
    {
      pattern: '/invite/:code',
      handler: ({ code }) => {
        // Handle invite link
        router.push(\`/(auth)/accept-invite?code=\${code}\`)
      },
    },
  ])
}
`
}
