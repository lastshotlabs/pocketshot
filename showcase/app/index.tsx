import { ScrollView, View, TouchableOpacity, Text, StyleSheet, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

const SECTIONS = [
  { label: 'Layout', route: '/layout' },
  { label: 'Data Display', route: '/data' },
  { label: 'Forms', route: '/forms' },
  { label: 'Overlay', route: '/overlay' },
  { label: 'Navigation', route: '/navigation' },
  { label: 'Content', route: '/content' },
  { label: 'Communication', route: '/communication' },
  { label: 'Auth', route: '/auth-components' },
  { label: 'Workflow', route: '/workflow' },
  { label: 'Commerce', route: '/commerce' },
  { label: 'Theme', route: '/theme' },
]

export default function ShowcaseIndex() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Pocketshot Showcase</Text>
      <Text style={styles.subtitle}>Component library + SDK demo</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.route}
            style={styles.item}
            onPress={() => router.push(section.route as never)}
            accessibilityRole="button"
            accessibilityLabel={`View ${section.label} components`}
            testID={`nav-${section.label.toLowerCase().replace(' ', '-')}`}
          >
            <Text style={styles.itemLabel}>{section.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  title: { fontSize: 28, fontWeight: '700', paddingHorizontal: 20, paddingTop: 20, color: '#18181b' },
  subtitle: { fontSize: 14, color: '#71717a', paddingHorizontal: 20, paddingBottom: 8 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginVertical: 4,
  },
  itemLabel: { fontSize: 16, fontWeight: '500', color: '#18181b' },
  arrow: { fontSize: 20, color: '#a1a1aa' },
})
