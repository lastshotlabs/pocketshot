import * as SecureStore from 'expo-secure-store'

export interface TokenStorage {
  getToken(): Promise<string | null>
  setToken(token: string): Promise<void>
  clearToken(): Promise<void>
  getRefreshToken(): Promise<string | null>
  setRefreshToken(token: string): Promise<void>
  clearRefreshToken(): Promise<void>
}

/**
 * Creates a TokenStorage backed by expo-secure-store.
 *
 * expo-secure-store is a peer dependency. If you do not use this factory
 * (i.e. you supply your own TokenStorage implementation to createPocketshot),
 * you can omit expo-secure-store from your app's dependencies — but this
 * module-level import will still be evaluated at SDK load time.
 *
 * TODO: Migrate to a subpath export (e.g. @lastshotlabs/pocketshot/storage)
 * so that only apps that call createSecureStoreStorage pay the import cost.
 */
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
