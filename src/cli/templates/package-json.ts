import type { PocketshotScaffoldConfig } from '../types'

export function packageJsonTemplate(config: PocketshotScaffoldConfig): string {
  const deps: Record<string, string> = {
    '@lastshotlabs/pocketshot': 'latest',
    '@tanstack/react-query': '^5.0.0',
    'expo': '55',
    'expo-linking': '~55.0.7',
    'expo-router': '~55.0.6',
    'expo-secure-store': '~55.0.9',
    'expo-status-bar': '~55.0.4',
    'expo-web-browser': '~55.0.10',
    'jotai': '^2.0.0',
    'react': '19.2.0',
    'react-native': '0.83.2',
    'react-native-safe-area-context': '~5.6.2',
    'react-native-screens': '~4.23.0',
  }
  if (config.mfaScreens) {
    deps['react-native-qrcode-svg'] = '^6.3.0'
    deps['react-native-svg'] = '^15.11.2'
  }
  return JSON.stringify({
    name: config.packageName,
    version: '0.0.1',
    main: 'expo-router/entry',
    scripts: {
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      sync: 'npx pocketshot sync',
    },
    dependencies: deps,
    devDependencies: {
      '@types/react': '~19.2.10',
      'typescript': '^5.3.0',
    },
  }, null, 2)
}
