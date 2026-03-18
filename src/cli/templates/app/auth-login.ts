export function authLoginTemplate(): string {
  return `import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router, useRouter } from 'expo-router'
import { useLogin } from '@/lib/pocketshot'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const routerHook = useRouter()
  const { mutate: login, isPending } = useLogin()

  function handleLogin() {
    if (!email || !password) return
    login(
      { email, password },
      {
        onSuccess: (result) => {
          if ('mfaRequired' in result && result.mfaRequired) {
            router.replace({
              pathname: '/(auth)/mfa',
              params: { mfaToken: result.mfaToken, methods: result.mfaMethods.join(',') },
            })
          } else {
            router.replace('/(app)/')
          }
        },
        onError: (err: any) => {
          Alert.alert('Login failed', err.data?.error ?? err.message)
        },
      }
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isPending}>
        <Text style={styles.buttonText}>{isPending ? 'Signing in\u2026' : 'Sign In'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Don't have an account? Create one</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => routerHook.push('/(auth)/forgot-password')}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16 },
  button: { backgroundColor: '#000', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#666', marginTop: 8 },
})
`
}
