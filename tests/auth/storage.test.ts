import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock expo-secure-store before importing storage
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}))

import * as SecureStore from 'expo-secure-store'
import { createSecureStoreStorage } from '../../src/auth/storage'

describe('createSecureStoreStorage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getToken returns stored value', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue('tok123')
    const s = createSecureStoreStorage('my_key')
    expect(await s.getToken()).toBe('tok123')
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('my_key')
  })

  it('setToken stores value', async () => {
    const s = createSecureStoreStorage('my_key')
    await s.setToken('abc')
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('my_key', 'abc')
  })

  it('clearToken deletes value', async () => {
    const s = createSecureStoreStorage('my_key')
    await s.clearToken()
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('my_key')
  })

  it('getRefreshToken uses refresh key', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue('refresh123')
    const s = createSecureStoreStorage('my_key')
    expect(await s.getRefreshToken()).toBe('refresh123')
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('my_key_refresh')
  })

  it('returns null when no token stored', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null)
    const s = createSecureStoreStorage('my_key')
    expect(await s.getToken()).toBeNull()
  })
})
