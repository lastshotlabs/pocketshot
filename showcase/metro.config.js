const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')
const Module = require('module')

const config = getDefaultConfig(__dirname)

const sdkRoot = path.resolve(__dirname, '..')
const showcaseModules = path.resolve(__dirname, 'node_modules')

config.watchFolders = [sdkRoot]

// Enable package.json `exports` field resolution (subpath exports like /ui)
config.resolver.unstable_enablePackageExports = true

// Set of Node.js built-in module names (fs, path, punycode, etc.).
// require.resolve on a built-in returns a path inside Node internals —
// outside Metro's watchFolders — which makes Metro unable to hash the file.
const nodeBuiltins = new Set(Module.builtinModules ?? [])
const isNodeBuiltin = (name) =>
  name.startsWith('node:') || nodeBuiltins.has(name) || nodeBuiltins.has(name.replace(/^node:/, ''))

// The showcase is the host app. For every non-relative, non-builtin import,
// prefer the showcase's node_modules over the SDK's node_modules. This
// guarantees a single copy of every native module (expo-router,
// react-native-safe-area-context, react-native-screens, etc.), which is
// required because React Native native views crash if registered more than once.
//
// If a package isn't in the showcase (an SDK-only optional dep like
// expo-notifications), require.resolve throws and we fall through to Metro's
// default resolution, which finds it in the SDK's node_modules.
//
// Built-ins are excluded: require.resolve('punycode') returns a path inside
// Node internals that Metro can't watch or hash.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isRelative = moduleName.startsWith('.') || moduleName.startsWith('/')
  if (!isRelative && !isNodeBuiltin(moduleName)) {
    try {
      const resolved = require.resolve(moduleName, { paths: [showcaseModules] })
      return { filePath: resolved, type: 'sourceFile' }
    } catch (_) {
      // Not in showcase's node_modules — fall through to default
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
