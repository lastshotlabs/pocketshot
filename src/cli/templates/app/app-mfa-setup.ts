export function appMfaSetupTemplate(): string {
  return `import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import QRCode from 'react-native-qrcode-svg'
import { useMfaSetup, useMfaVerifySetup } from '@/lib/pocketshot'

export default function MfaSetupScreen() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const { mutate: setup, data: setupData, isPending: settingUp, error: setupError } = useMfaSetup()
  const { mutate: verify, isPending: verifying, isSuccess: verified, error: verifyError } = useMfaVerifySetup()

  useEffect(() => { setup() }, [])

  if (verified) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>MFA enabled!</Text>
        <Text style={styles.message}>Your authenticator app is now set up.</Text>
        <TouchableOpacity onPress={() => router.replace('/(app)/')}>
          <Text style={styles.link}>Continue</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (settingUp || !setupData) {
    return <ActivityIndicator style={{ flex: 1 }} />
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up authenticator</Text>
      <Text style={styles.message}>Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).</Text>
      <View style={styles.qr}>
        <QRCode value={setupData.qrCodeUrl} size={200} />
      </View>
      <Text style={styles.secret}>Manual key: {setupData.secret}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />
      {verifyError && <Text style={styles.error}>{(verifyError as Error).message}</Text>}
      {setupError && <Text style={styles.error}>{(setupError as Error).message}</Text>}
      <TouchableOpacity style={styles.button} onPress={() => verify({ code })} disabled={verifying || code.length < 6}>
        {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify and enable</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  message: { color: '#555', marginBottom: 24, textAlign: 'center' },
  qr: { marginBottom: 24 },
  secret: { fontSize: 12, color: '#888', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, width: '100%' },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#007AFF', marginTop: 16 },
  error: { color: 'red', marginBottom: 12 },
})
`
}
