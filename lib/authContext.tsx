import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getToken } from './tokenStorage'

interface AuthContextValue {
  isAuthed: boolean
  isReady: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    getToken().then(t => {
      setIsAuthed(!!t)
      setIsReady(true)
    })
  }, [])

  function signIn() { setIsAuthed(true) }
  function signOut() { setIsAuthed(false) }

  return (
    <AuthContext.Provider value={{ isAuthed, isReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
