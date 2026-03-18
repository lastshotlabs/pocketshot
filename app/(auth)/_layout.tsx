import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Sign In' }} />
      <Stack.Screen name="register" options={{ title: 'Create Account' }} />
      <Stack.Screen name="mfa" options={{ title: 'Verify' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
      <Stack.Screen name="verify-email" options={{ title: 'Verify Email' }} />
    </Stack>
  )
}
