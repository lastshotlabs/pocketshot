import * as SecureStore from 'expo-secure-store'

export interface TokenStorage {
  get: () => Promise<string | null>
  set: (token: string) => Promise<void>
  clear: () => Promise<void>
  getRefreshToken: () => Promise<string | null>
  setRefreshToken: (token: string) => Promise<void>
  clearRefreshToken: () => Promise<void>
}

export function createSecureStoreStorage(key = 'pocketshot_token'): TokenStorage {
  const refreshKey = `${key}_refresh`
  return {
    get: () => SecureStore.getItemAsync(key),
    set: (token) => SecureStore.setItemAsync(key, token),
    clear: () => SecureStore.deleteItemAsync(key),
    getRefreshToken: () => SecureStore.getItemAsync(refreshKey),
    setRefreshToken: (token) => SecureStore.setItemAsync(refreshKey, token),
    clearRefreshToken: () => SecureStore.deleteItemAsync(refreshKey),
  }
}

export const tokenStorage = createSecureStoreStorage()
