import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { resolveTokens, flavorNames, defaultSpacing, defaultRadius } from '@lastshotlabs/pocketshot/ui'
import type { FlavorName, DesignTokens } from '@lastshotlabs/pocketshot/ui'

const FLAVOR_LIST: FlavorName[] = [...flavorNames]

function FlavorCard({
  flavor,
  tokens,
  selected,
  onSelect,
}: {
  flavor: FlavorName
  tokens: DesignTokens
  selected: boolean
  onSelect: () => void
}) {
  return (
    <TouchableOpacity
      style={[
        styles.flavorCard,
        { borderColor: selected ? tokens.colors.primary : '#e4e4e7' },
        selected && { borderWidth: 2 },
      ]}
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Select ${flavor} flavor`}
      testID={`theme-flavor-${flavor}`}
    >
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, { backgroundColor: tokens.colors.primary }]} />
        <View style={[styles.swatch, { backgroundColor: tokens.colors.secondary }]} />
        <View style={[styles.swatch, { backgroundColor: tokens.colors.accent }]} />
        <View style={[styles.swatch, { backgroundColor: tokens.colors.success }]} />
        <View style={[styles.swatch, { backgroundColor: tokens.colors.warning }]} />
        <View style={[styles.swatch, { backgroundColor: tokens.colors.error }]} />
        <View style={[styles.swatch, { backgroundColor: tokens.colors.info }]} />
      </View>
      <Text
        style={[
          styles.flavorName,
          { color: selected ? tokens.colors.primary : '#18181b' },
        ]}
      >
        {flavor}
        {selected ? ' ✓' : ''}
      </Text>
    </TouchableOpacity>
  )
}

function TokenTable({ tokens }: { tokens: DesignTokens }) {
  return (
    <View style={styles.tokenSection}>
      <Text style={styles.tokenSectionTitle}>Spacing Scale</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tokenRow}>
          {([1, 2, 3, 4, 6, 8, 10, 12, 16, 20] as const).map((key) => {
            const val = tokens.spacing[key as keyof typeof tokens.spacing]
            return (
              <View key={key} style={styles.tokenItem}>
                <View style={[styles.spacingBlock, { width: val, height: val }]} />
                <Text style={styles.tokenKey}>{key}</Text>
                <Text style={styles.tokenVal}>{val}px</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <Text style={[styles.tokenSectionTitle, { marginTop: 16 }]}>Radius Scale</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tokenRow}>
          {Object.entries(tokens.radius).map(([key, val]) => (
            <View key={key} style={styles.tokenItem}>
              <View
                style={[
                  styles.radiusBlock,
                  { borderRadius: typeof val === 'number' ? val : 9999 },
                ]}
              />
              <Text style={styles.tokenKey}>{key}</Text>
              <Text style={styles.tokenVal}>{val}px</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.tokenSectionTitle, { marginTop: 16 }]}>Color Tokens</Text>
      <View style={styles.colorGrid}>
        {[
          ['background', tokens.colors.background],
          ['surface', tokens.colors.surface],
          ['primary', tokens.colors.primary],
          ['secondary', tokens.colors.secondary],
          ['accent', tokens.colors.accent],
          ['success', tokens.colors.success],
          ['warning', tokens.colors.warning],
          ['error', tokens.colors.error],
          ['info', tokens.colors.info],
          ['text', tokens.colors.text],
          ['textMuted', tokens.colors.textMuted],
          ['border', tokens.colors.border],
          ['inputBackground', tokens.colors.inputBackground],
          ['destructive', tokens.colors.destructive],
        ].map(([name, color]) => (
          <View key={name} style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: color as string }]} />
            <Text style={styles.colorName}>{name}</Text>
            <Text style={styles.colorHex}>{color}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.tokenSectionTitle, { marginTop: 16 }]}>Typography</Text>
      <View style={styles.typographyTable}>
        {[
          ['fontSizeXs', tokens.typography.fontSizeXs],
          ['fontSizeSm', tokens.typography.fontSizeSm],
          ['fontSizeMd', tokens.typography.fontSizeMd],
          ['fontSizeLg', tokens.typography.fontSizeLg],
          ['fontSizeXl', tokens.typography.fontSizeXl],
          ['fontSize2xl', tokens.typography.fontSize2xl],
          ['fontSize3xl', tokens.typography.fontSize3xl],
        ].map(([key, val]) => (
          <View key={key as string} style={styles.typographyRow}>
            <Text style={styles.tokenKey}>{key}</Text>
            <Text style={[styles.tokenVal, { fontSize: val as number }]}>Aa</Text>
            <Text style={styles.tokenVal}>{val}px</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default function ThemeShowcase() {
  const router = useRouter()
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorName>('neutral')
  const [scheme, setScheme] = useState<'light' | 'dark'>('light')

  const tokens = resolveTokens({ flavor: selectedFlavor, colorScheme: scheme }, scheme)

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: tokens.colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="theme-back"
        >
          <Text style={[styles.back, { color: tokens.colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: tokens.colors.text }]}>Theme</Text>
        <TouchableOpacity
          style={[styles.schemeToggle, { backgroundColor: tokens.colors.surface }]}
          onPress={() => setScheme(scheme === 'light' ? 'dark' : 'light')}
          accessibilityRole="switch"
          accessibilityLabel={`Switch to ${scheme === 'light' ? 'dark' : 'light'} mode`}
          testID="theme-scheme-toggle"
        >
          <Text style={{ color: tokens.colors.text }}>{scheme === 'light' ? '☀️ Light' : '🌙 Dark'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionLabel, { color: tokens.colors.textMuted }]}>FLAVOR</Text>
        <Text style={[styles.selectedFlavor, { color: tokens.colors.primary }]}>
          {selectedFlavor}
        </Text>

        <View style={styles.flavorGrid}>
          {FLAVOR_LIST.map((flavor) => {
            const flavorTokens = resolveTokens({ flavor, colorScheme: scheme }, scheme)
            return (
              <FlavorCard
                key={flavor}
                flavor={flavor}
                tokens={flavorTokens}
                selected={selectedFlavor === flavor}
                onSelect={() => setSelectedFlavor(flavor)}
              />
            )
          })}
        </View>

        <View style={[styles.previewCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <Text style={[styles.previewHeading, { color: tokens.colors.text, fontSize: tokens.typography.fontSize2xl }]}>
            Live Preview
          </Text>
          <Text style={[styles.previewBody, { color: tokens.colors.textMuted }]}>
            This card updates instantly when you switch flavors or color schemes.
          </Text>
          <View style={styles.previewActions}>
            <View style={[styles.previewBtn, { backgroundColor: tokens.colors.primary, borderRadius: tokens.radius.md }]}>
              <Text style={{ color: tokens.colors.primaryForeground, fontWeight: '600' }}>Primary</Text>
            </View>
            <View style={[styles.previewBtn, { backgroundColor: tokens.colors.secondary, borderRadius: tokens.radius.md }]}>
              <Text style={{ color: tokens.colors.secondaryForeground, fontWeight: '600' }}>Secondary</Text>
            </View>
          </View>
          <View style={styles.previewBadges}>
            {[
              { label: 'success', bg: tokens.colors.success, fg: tokens.colors.successForeground },
              { label: 'warning', bg: tokens.colors.warning, fg: tokens.colors.warningForeground },
              { label: 'error', bg: tokens.colors.error, fg: tokens.colors.errorForeground },
              { label: 'info', bg: tokens.colors.info, fg: tokens.colors.infoForeground },
            ].map(({ label, bg, fg }) => (
              <View
                key={label}
                style={[styles.previewBadge, { backgroundColor: bg, borderRadius: tokens.radius.full }]}
              >
                <Text style={{ color: fg, fontSize: 11, fontWeight: '600' }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <TokenTable tokens={tokens} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  back: { fontSize: 24, marginRight: 12 },
  title: { fontSize: 20, fontWeight: '700', flex: 1 },
  schemeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  selectedFlavor: { fontSize: 28, fontWeight: '700', textTransform: 'capitalize' },
  flavorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flavorCard: {
    width: '47%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
  },
  swatchRow: { flexDirection: 'row', gap: 4 },
  swatch: { width: 20, height: 20, borderRadius: 10 },
  flavorName: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  previewHeading: { fontWeight: '700' },
  previewBody: { fontSize: 14, lineHeight: 20 },
  previewActions: { flexDirection: 'row', gap: 10 },
  previewBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  previewBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tokenSection: { gap: 8 },
  tokenSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tokenRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  tokenItem: { alignItems: 'center', gap: 4, minWidth: 44 },
  spacingBlock: { backgroundColor: '#7c3aed', borderRadius: 2 },
  radiusBlock: { width: 32, height: 32, backgroundColor: '#7c3aed' },
  tokenKey: { fontSize: 10, color: '#71717a', fontWeight: '600' },
  tokenVal: { fontSize: 10, color: '#18181b' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorItem: { alignItems: 'center', gap: 2, width: 80 },
  colorSwatch: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#e4e4e7' },
  colorName: { fontSize: 9, color: '#71717a', textAlign: 'center' },
  colorHex: { fontSize: 8, color: '#a1a1aa', textAlign: 'center' },
  typographyTable: { gap: 6 },
  typographyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
})
