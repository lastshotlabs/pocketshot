const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// PocketShot publishes explicit package subpath exports such as `/ui`.
config.resolver.unstable_enablePackageExports = true

module.exports = config
