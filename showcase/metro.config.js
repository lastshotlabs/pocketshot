const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

const sdkRoot = path.resolve(__dirname, '..')
const showcaseModules = path.resolve(__dirname, 'node_modules')

config.watchFolders = [sdkRoot]

// Enable package.json `exports` field resolution (subpath exports like /ui)
config.resolver.unstable_enablePackageExports = true

// Packages that must exist as exactly one instance across the entire module graph.
// extraNodeModules is not enough — Metro resolves from the SDK's own node_modules first.
// resolveRequest intercepts every lookup and redirects these packages to the showcase copy.
const SINGLETONS = ['react', 'react-native', 'react/jsx-runtime', 'jotai', '@tanstack/react-query']

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = SINGLETONS.some(
    (s) => moduleName === s || moduleName.startsWith(s + '/'),
  )
  if (isSingleton) {
    try {
      const resolved = require.resolve(moduleName, { paths: [showcaseModules] })
      return { filePath: resolved, type: 'sourceFile' }
    } catch (_) {
      // fall through to default resolution
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
