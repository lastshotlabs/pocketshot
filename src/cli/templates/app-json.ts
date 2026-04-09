import type { PocketshotScaffoldConfig } from '../types'

export function appJsonTemplate(config: PocketshotScaffoldConfig): string {
  return JSON.stringify(
    {
      expo: {
        name: config.projectName,
        slug: config.packageName,
        version: '1.0.0',
        scheme: config.scheme,
        ios: { bundleIdentifier: config.appId },
        android: {
          package: config.appId,
          intentFilters: [
            {
              action: 'VIEW',
              autoVerify: true,
              data: [{ scheme: config.scheme }],
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        },
        plugins: ['expo-router', 'expo-secure-store', 'expo-web-browser'],
        experiments: { typedRoutes: true },
      },
    },
    null,
    2,
  )
}
