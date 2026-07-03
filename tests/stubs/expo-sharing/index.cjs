// Local test stub for the optional peer `expo-sharing`.
// Loaded via require('expo-sharing') in src/share/index.ts when the real native
// module isn't installed (dev/test). Mirrors the subset of the API the SDK uses.
module.exports = {
  isAvailableAsync: () => Promise.resolve(true),
  shareAsync: (_url, _opts) => Promise.resolve(),
}
