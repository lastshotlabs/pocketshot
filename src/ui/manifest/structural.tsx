import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'

interface ManifestStructuralProps {
  children: React.ReactNode
}

export function ManifestStructural({ children }: ManifestStructuralProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1 },
})
