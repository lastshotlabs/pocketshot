import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'undetermined', canAskAgain: true, granted: false }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted', canAskAgain: true, granted: true }),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token]' }),
  addNotificationReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  addNotificationResponseReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  setNotificationHandler: vi.fn(),
}))
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: { eas: { projectId: 'test-project' } } } } }))
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((opts: any) => ({ _opts: opts })),
}))
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useEffect: vi.fn(),
    useRef: vi.fn(() => ({ current: null })),
    useState: vi.fn((initial: unknown) => [initial, vi.fn()]),
  }
})

import { createPushHooks } from '../../src/push/hooks'
import type { ApiClient } from '../../src/api/client'
import { useMutation } from '@tanstack/react-query'

const mockUseMutation = useMutation as ReturnType<typeof vi.fn>

function makeApi(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), fetch: vi.fn() } as unknown as ApiClient
}

describe('createPushHooks factory shape', () => {
  it('returns all expected hooks', () => {
    const hooks = createPushHooks(makeApi())
    const expected = [
      'useRequestPushPermission',
      'usePushPermissionStatus',
      'useRegisterPushToken',
      'useNotificationListener',
      'useNotificationTapListener',
    ]
    for (const name of expected) {
      expect(typeof (hooks as Record<string, unknown>)[name]).toBe('function')
    }
  })
})

describe('useRegisterPushToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts the push token to the backend', async () => {
    const api = makeApi()
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
    mockUseMutation.mockImplementation((opts: any) => ({ _opts: opts }))
    const { useRegisterPushToken } = createPushHooks(api)
    const { _opts } = useRegisterPushToken() as any
    await _opts.mutationFn({ token: 'ExponentPushToken[abc]', platform: 'ios' })
    expect(api.post).toHaveBeenCalledWith(
      expect.stringContaining('/push'),
      expect.objectContaining({ token: 'ExponentPushToken[abc]' }),
    )
  })
})
