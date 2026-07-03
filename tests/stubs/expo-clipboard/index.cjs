// Local test stub for the optional peer `expo-clipboard`.
// Loaded via require('expo-clipboard') in src/share/index.ts when the real native
// module isn't installed (dev/test). Mirrors the subset of the API the SDK uses.
module.exports = {
  getStringAsync: () => Promise.resolve(''),
  setStringAsync: (_text, _opts) => Promise.resolve(true),
  hasStringAsync: () => Promise.resolve(false),
  addClipboardListener: (_cb) => ({ remove: () => {} }),
}
