const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

const sdkRoot = path.resolve(__dirname, '..')
const showcaseModules = path.resolve(__dirname, 'node_modules')

config.watchFolders = [sdkRoot]

// Enable package.json `exports` field resolution (subpath exports like /ui)
config.resolver.unstable_enablePackageExports = true

// Any package that registers native views, uses React context, or maintains
// global singleton state must resolve to exactly one copy — the showcase's.
// This applies to react, react-native, all expo-* packages, all react-native-*
// packages, and shared state libraries.
//
// When the SDK's dist/index.js is loaded, Metro follows its require() calls and
// may resolve them from pocketshot/node_modules instead of showcase/node_modules,
// resulting in duplicate native view registrations (the RNCSafeAreaProvider crash).
// This resolver intercepts every such lookup and redirects it to the showcase copy.
const SINGLETON_PREFIXES = [
  'react',
  'react-native',
  'expo',
  '@expo',
  '@react-native',
  '@react-native-community',
  'jotai',
  '@tanstack/react-query',
]

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = SINGLETON_PREFIXES.some(
    (prefix) => moduleName === prefix || moduleName.startsWith(prefix + '/'),
  )
  if (isSingleton) {
    try {
      const resolved = require.resolve(moduleName, { paths: [showcaseModules] })
      return { filePath: resolved, type: 'sourceFile' }
    } catch (_) {
      // Package not installed in showcase — fall through to default resolution
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
