import { Redirect, Stack } from 'expo-router'
import { useUser } from '@/lib/auth'

export default function AppLayout() {
  const { user, isLoading } = useUser()
  if (isLoading) return null
  if (!user) return <Redirect href="/(auth)/login" />
  return <Stack />
}
