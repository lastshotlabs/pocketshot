import { useLocalSearchParams } from 'expo-router'
import PartyShell from '../index'

export default function JoinPartyRoute() {
  const { code } = useLocalSearchParams<{ code: string }>()
  return <PartyShell initialJoinCode={Array.isArray(code) ? code[0] : code} />
}
