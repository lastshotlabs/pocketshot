import type { PocketshotScaffoldConfig } from '../types'

export function packageJsonTemplate(config: PocketshotScaffoldConfig): string {
  const deps: Record<string, string> = {
    '@lastshotlabs/pocketshot': 'latest',
    '@tanstack/react-query': '^5.0.0',
    expo: '~57.0.8',
    'expo-dev-client': '~57.0.9',
    'expo-linking': '~57.0.4',
    'expo-router': '~57.0.8',
    'expo-secure-store': '~57.0.1',
    'expo-status-bar': '~57.0.1',
    'expo-web-browser': '~57.0.2',
    jotai: '^2.0.0',
    react: '19.2.3',
    'react-native': '0.86.0',
    'react-native-safe-area-context': '~5.7.0',
    'react-native-screens': '~4.26.0',
  }
  if (config.mfaScreens) {
    deps['react-native-qrcode-svg'] = '^6.3.21'
    deps['react-native-svg'] = '15.15.4'
  }
  return JSON.stringify(
    {
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
        '@types/react': '~19.2.4',
        typescript: '~6.0.3',
      },
    },
    null,
    2,
  )
}
