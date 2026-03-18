import { Redirect, Stack } from 'expo-router'
import { useUser } from '@/lib/pocketshot'

export default function AppLayout() {
  const { data: user, isLoading } = useUser()

  if (isLoading) return null
  if (!user) return <Redirect href="/(auth)/login" />

  return <Stack />
}
