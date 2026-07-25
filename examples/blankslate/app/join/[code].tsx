import { useLocalSearchParams } from 'expo-router'
import BlankSlateApp from '../index'

export default function JoinBlankSlateRoute() {
  const { code } = useLocalSearchParams<{ code: string }>()
  return <BlankSlateApp initialJoinCode={Array.isArray(code) ? code[0] : code} />
}
