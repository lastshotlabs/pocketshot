import React from 'react'
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

interface Props {
  title: string
  children: React.ReactNode
}

const EMPTY: never[] = []

export function ShowcaseScreen({ title, children }: Props) {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="back-button"
        >
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={EMPTY}
        renderItem={null}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<>{children}</>}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  )
}

export function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  back: { fontSize: 24, color: '#7c3aed', marginRight: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
  },
})
