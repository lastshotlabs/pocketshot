import * as SecureStore from 'expo-secure-store'

export interface TokenStorage {
  getToken(): Promise<string | null>
  setToken(token: string): Promise<void>
  clearToken(): Promise<void>
  getRefreshToken(): Promise<string | null>
  setRefreshToken(token: string): Promise<void>
  clearRefreshToken(): Promise<void>
}

export function createSecureStoreStorage(key: string): TokenStorage {
  const refreshKey = `${key}_refresh`
  return {
    getToken: () => SecureStore.getItemAsync(key),
    setToken: (token) => SecureStore.setItemAsync(key, token),
    clearToken: () => SecureStore.deleteItemAsync(key),
    getRefreshToken: () => SecureStore.getItemAsync(refreshKey),
    setRefreshToken: (token) => SecureStore.setItemAsync(refreshKey, token),
    clearRefreshToken: () => SecureStore.deleteItemAsync(refreshKey),
  }
}
