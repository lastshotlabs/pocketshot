import { useLocalSearchParams } from 'expo-router'
import BurndownApp from '../index'

export default function JoinBurndownRoute() {
  const { code } = useLocalSearchParams<{ code: string }>()
  return <BurndownApp initialJoinCode={Array.isArray(code) ? code[0] : code} />
}
