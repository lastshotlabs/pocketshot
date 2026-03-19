const warned = new Set<string>()

export function warnOnce(key: string, message: string): void {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return
  if (warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/** Reset all warnings — for use in tests only */
export function _resetWarnings(): void {
  warned.clear()
}
