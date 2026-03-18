import { useEffect, useState } from 'react'
import { Redirect, Stack } from 'expo-router'
import { getToken } from '@/lib/tokenStorage'

export default function AppLayout() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    getToken().then(t => { setAuthed(!!t); setReady(true) })
  }, [])

  if (!ready) return null
  if (!authed) return <Redirect href="/(auth)/login" />

  return <Stack />
}
