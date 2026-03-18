import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/lib/authContext'

export default function AppLayout() {
  const { isReady, isAuthed } = useAuth()
  if (!isReady) return null
  if (!isAuthed) return <Redirect href="/(auth)/login" />
  return <Stack />
}
