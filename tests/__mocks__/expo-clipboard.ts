// Stub for expo-clipboard — replaced by vi.mock() in tests that need assertions.
export const getStringAsync = () => Promise.resolve('')
export const setStringAsync = (_text: string) => Promise.resolve(true)
export const hasStringAsync = () => Promise.resolve(false)
export const addClipboardListener = (_cb: unknown) => ({ remove: () => {} })
