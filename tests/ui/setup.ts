import { vi } from 'vitest'

// Suppress react-test-renderer deprecation warnings and act() environment warnings.
// These are noisy but cosmetic in a Node/vitest environment.
;(global as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
const originalError = console.error.bind(console)
console.error = (...args: unknown[]) => {
  const msg = String(args[0])
  if (
    msg.includes('react-test-renderer is deprecated') ||
    msg.includes('not configured to support act')
  )
    return
  originalError(...args)
}

// Mock react-native globally. The real package ships Flow-typed source that
// Node/esbuild cannot parse. This stub provides functional React components
// for all core RN primitives.
//
// NOTE: vi.mock in setupFiles is NOT hoisted — it runs as normal code. This
// works for our source files (their ESM imports are intercepted). External
// CJS packages (like @testing-library/react-native) that do require('react-native')
// bypass this; renderWithProviders uses react-test-renderer to avoid that.
vi.mock('react-native', async () => {
  const mock = await import('./__mocks__/react-native')
  return { ...mock, default: mock.default }
})

// Mock expo-router so ScreenContextProvider can initialize without a real router.
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
}))
