import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Modal as RNModal,
  FlatList,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { CommandPaletteConfig } from './types'

type CommandItem = CommandPaletteConfig['items'][number]

// ---------------------------------------------------------------------------
// Fuzzy match
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, text: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
    },
    container: {
      flex: 1,
      paddingTop: tokens.spacing[12],
      paddingHorizontal: tokens.spacing[4],
      paddingBottom: tokens.spacing[4],
    },
    panel: {
      flex: 1,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      ...tokens.shadows.xl,
      overflow: 'hidden',
      maxHeight: '80%',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    searchIcon: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      marginRight: tokens.spacing[2],
    },
    searchInput: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      padding: 0,
    },
    clearButton: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: tokens.spacing[2],
    },
    clearText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    groupHeader: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[3],
      paddingBottom: tokens.spacing[1],
    },
    groupLabel: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[2],
    },
    itemIcon: {
      fontSize: 16,
      width: 24,
      textAlign: 'center' as const,
    },
    itemContent: {
      flex: 1,
    },
    itemLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    itemDescription: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: 1,
    },
    itemShortcut: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.sm,
      paddingHorizontal: tokens.spacing[1],
      paddingVertical: 1,
      overflow: 'hidden',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[8],
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
      marginHorizontal: tokens.spacing[4],
    },
  })
}

// ---------------------------------------------------------------------------
// List item types for grouped rendering
// ---------------------------------------------------------------------------

type ListEntry =
  | { type: 'group'; group: string; key: string }
  | { type: 'item'; item: CommandItem; key: string }

// ---------------------------------------------------------------------------
// CommandPalette
// ---------------------------------------------------------------------------

/**
 * Searchable action launcher. Opens via setValue('__commandPalette_<id>', true).
 * Renders a full-screen Modal with a search input and filtered FlatList.
 * Items can be grouped. Selection dispatches the item's onSelect action.
 */
export function CommandPalette({ config }: { config: CommandPaletteConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()
  const [query, setQuery] = useState('')
  const inputRef = useRef<TextInput>(null)

  const isOpen = Boolean(getValue(`__commandPalette_${config.id}`))
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const maxResults = config.maxResults ?? 20
  const placeholder = config.placeholder ?? 'Type a command...'

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      opacity.setValue(0)
      translateY.setValue(-20)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        inputRef.current?.focus()
      })
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [isOpen, opacity, translateY])

  const handleClose = useCallback(() => {
    setValue(`__commandPalette_${config.id}`, false)
  }, [config.id, setValue])

  const handleSelect = useCallback(
    async (item: CommandItem) => {
      handleClose()
      await dispatch(item.onSelect)
    },
    [handleClose, dispatch],
  )

  // Filter items by fuzzy match on label + description
  const filteredEntries = useMemo<ListEntry[]>(() => {
    const q = query.trim()
    let items = config.items
    if (q.length > 0) {
      items = config.items.filter(
        (item) =>
          fuzzyMatch(q, item.label) ||
          (item.description != null && fuzzyMatch(q, item.description)),
      )
    }
    items = items.slice(0, maxResults)

    // Group items
    const seenGroups = new Set<string>()
    const entries: ListEntry[] = []
    for (const item of items) {
      const group = item.group ?? ''
      if (group && !seenGroups.has(group)) {
        seenGroups.add(group)
        entries.push({ type: 'group', group, key: `group-${group}` })
      }
      entries.push({ type: 'item', item, key: `item-${item.id}` })
    }
    return entries
  }, [query, config.items, maxResults])

  const renderEntry = useCallback(
    ({ item: entry }: { item: ListEntry }) => {
      if (entry.type === 'group') {
        return (
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel}>{entry.group}</Text>
          </View>
        )
      }
      const { item } = entry
      return (
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityHint={item.description}
          testID={`command-palette-item-${item.id}`}
          activeOpacity={0.7}
        >
          {item.icon != null && (
            <Text style={styles.itemIcon} accessibilityElementsHidden>
              {item.icon}
            </Text>
          )}
          <View style={styles.itemContent}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            {item.description != null && (
              <Text style={styles.itemDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          {item.shortcut != null && (
            <Text style={styles.itemShortcut}>{item.shortcut}</Text>
          )}
        </TouchableOpacity>
      )
    },
    [styles, handleSelect],
  )

  const keyExtractor = useCallback((entry: ListEntry) => entry.key, [])

  const baseTestID = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Close command palette">
          <Animated.View style={[styles.backdrop, { opacity }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[styles.container, { transform: [{ translateY }] }]}
              >
                <View style={styles.panel}>
                  {/* Search bar */}
                  <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon} accessibilityElementsHidden>
                      🔍
                    </Text>
                    <TextInput
                      ref={inputRef}
                      style={styles.searchInput}
                      value={query}
                      onChangeText={setQuery}
                      placeholder={placeholder}
                      placeholderTextColor={tokens.colors.inputPlaceholder}
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="done"
                      accessibilityLabel="Search commands"
                      testID={`${baseTestID}-search`}
                    />
                    {query.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setQuery('')}
                        style={styles.clearButton}
                        accessibilityLabel="Clear search"
                        accessibilityRole="button"
                        testID={`${baseTestID}-clear`}
                      >
                        <Text style={styles.clearText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Results */}
                  {filteredEntries.length > 0 ? (
                    <FlatList
                      data={filteredEntries}
                      keyExtractor={keyExtractor}
                      renderItem={renderEntry}
                      keyboardShouldPersistTaps="handled"
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No results found</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    </ComponentWrapper>
  )
}

