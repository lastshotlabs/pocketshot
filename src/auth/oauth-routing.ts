export interface NativeOAuthCallback {
  provider: 'apple' | 'google'
  code: string | null
  state: string | null
  error: string | null
  errorDescription: string | null
}

export function normalizeOAuthSystemPath(path: string, schemes: readonly string[]): string {
  let url: URL
  try {
    url = new URL(path)
  } catch {
    return path
  }
  const scheme = url.protocol.slice(0, -1).toLowerCase()
  if (!schemes.map((value) => value.toLowerCase()).includes(scheme)) return path
  if (url.hostname.toLowerCase() !== 'oauth' || url.hash || url.username || url.password)
    return path
  const segments = url.pathname.split('/').filter(Boolean)
  const provider = segments.length === 1 ? segments[0]?.toLowerCase() : null
  if (provider !== 'apple' && provider !== 'google') return path
  const params = url.searchParams
  const safe = new URLSearchParams()
  for (const key of ['code', 'state', 'error', 'error_description']) {
    const value = params.get(key)
    if (value) safe.set(key, value)
  }
  const encoded = safe.toString()
  return `/oauth/${provider}${encoded ? `?${encoded}` : ''}`
}

export function parseOAuthCallback(
  provider: string | string[] | undefined,
  params: Record<string, string | string[] | undefined>,
): NativeOAuthCallback | null {
  const selectedProvider = Array.isArray(provider) ? provider[0] : provider
  if (selectedProvider !== 'apple' && selectedProvider !== 'google') return null
  const value = (key: string): string | null => {
    const candidate = params[key]
    const selected = Array.isArray(candidate) ? candidate[0] : candidate
    return selected?.trim() || null
  }
  return {
    provider: selectedProvider,
    code: value('code'),
    state: value('state'),
    error: value('error'),
    errorDescription: value('error_description'),
  }
}
