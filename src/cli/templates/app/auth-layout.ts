import type { PocketshotScaffoldConfig } from '../../types'

export function authLayoutTemplate(config: PocketshotScaffoldConfig): string {
  const screens = ['login', 'register', 'mfa']
  if (config.authScreens) screens.push('forgot-password', 'reset-password', 'verify-email')
  if (config.oauthScreens) screens.push('oauth-callback')

  const screenTitles: Record<string, string> = {
    login: 'Sign In',
    register: 'Create Account',
    mfa: 'Verify',
    'forgot-password': 'Forgot Password',
    'reset-password': 'Reset Password',
    'verify-email': 'Verify Email',
    'oauth-callback': 'Sign In',
  }

  const screenLines = screens
    .map((s) => `      <Stack.Screen name="${s}" options={{ title: '${screenTitles[s] ?? s}' }} />`)
    .join('\n')

  return `import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack>
${screenLines}
    </Stack>
  )
}
`
}
