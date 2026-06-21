import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal as RNModal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface CommandPaletteItem {
  id: string
  label: string
  description?: string
  icon?: string
  shortcut?: string
  group?: string
  onSelect?: () => void
}

export interface CommandPaletteBaseProps {
  visible: boolean
  onClose: () => void
  items: CommandPaletteItem[]
  placeholder?: string
  maxResults?: number
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

function fuzzyMatch(query: string, text: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

type ListEntry =
  | { type: 'group'; group: string; key: string }
  | { type: 'item'; item: CommandPaletteItem; key: string }

/**
 * Standalone CommandPalette — plain React props, no manifest required.
 *
 * @example
 * <CommandPaletteBase
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   items={[{ id: 'new', label: 'New File', onSelect: () => create() }]}
 * />
 */
export function CommandPaletteBase({
  visible,
  onClose,
  items,
  placeholder = 'Type a command...',
  maxResults = 20,
  style,
  slots,
  testID,
  id,
}: CommandPaletteBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [query, setQuery] = useState('')
  const inputRef = useRef<TextInput>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current

  useEffect(() => {
    if (visible) {
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
  }, [visible, opacity, translateY])

  const handleSelect = useCallback(
    (item: CommandPaletteItem) => {
      onClose()
      item.onSelect?.()
    },
    [onClose],
  )

  const filteredEntries = useMemo<ListEntry[]>(() => {
    const q = query.trim()
    let filtered = items
    if (q.length > 0) {
      filtered = items.filter(
        (item) =>
          fuzzyMatch(q, item.label) ||
          (item.description != null && fuzzyMatch(q, item.description)),
      )
    }
    filtered = filtered.slice(0, maxResults)
    const seenGroups = new Set<string>()
    const entries: ListEntry[] = []
    for (const item of filtered) {
      const group = item.group ?? ''
      if (group && !seenGroups.has(group)) {
        seenGroups.add(group)
        entries.push({ type: 'group', group, key: `group-${group}` })
      }
      entries.push({ type: 'item', item, key: `item-${item.id}` })
    }
    return entries
  }, [items, maxResults, query])

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
  })
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      paddingTop: '2xl',
      paddingX: 'md',
      paddingBottom: 'md',
    },
    componentSurface: slots?.container,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      bg: 'card',
      borderRadius: 'lg',
      shadow: 'xl',
      overflow: 'hidden',
      maxHeight: '80%',
    },
    componentSurface: slots?.panel,
  })
  const searchContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'sm',
    },
    componentSurface: slots?.searchContainer,
  })
  const searchIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'muted', marginRight: 'xs' },
    componentSurface: slots?.searchIcon,
  })
  const searchInputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, fontSize: 'base', color: 'foreground' },
    componentSurface: slots?.searchInput,
  })
  const clearButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 'xs',
    },
    componentSurface: slots?.clearButton,
  })
  const clearTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.clearText,
  })
  const groupHeaderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingTop: 'sm', paddingBottom: 'xs' },
    componentSurface: slots?.groupHeader,
  })
  const groupLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'semibold',
      color: 'muted',
      letterSpacing: 'wide',
    },
    componentSurface: slots?.groupLabel,
  })
  const itemRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'sm',
      gap: 'xs',
    },
    componentSurface: slots?.itemRow,
  })
  const itemIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', width: 24, textAlign: 'center' },
    componentSurface: slots?.itemIcon,
  })
  const itemContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.itemContent,
  })
  const itemLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'medium', color: 'foreground' },
    componentSurface: slots?.itemLabel,
  })
  const itemDescriptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted', marginTop: 2 },
    componentSurface: slots?.itemDescription,
  })
  const itemShortcutSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      bg: 'surfaceAlt',
      borderRadius: 'sm',
      paddingX: 'xs',
    },
    componentSurface: slots?.itemShortcut,
  })
  const emptyContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { alignItems: 'center', justifyContent: 'center', paddingY: 'xl' },
    componentSurface: slots?.emptyContainer,
  })
  const emptyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.emptyText,
  })
  const separatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border' },
    componentSurface: slots?.separator,
  })

  const baseTestID = testID ?? id

  const renderEntry = useCallback(
    ({ item: entry }: { item: ListEntry }) => {
      if (entry.type === 'group') {
        return (
          <View style={groupHeaderSurface.style as ViewStyle | undefined}>
            <Text
              style={{
                ...sharedTextStyle,
                ...(groupLabelSurface.style as TextStyle | undefined),
              }}
            >
              {entry.group}
            </Text>
          </View>
        )
      }
      const { item } = entry
      return (
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          style={itemRowSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityHint={item.description}
          testID={`command-palette-item-${item.id}`}
          activeOpacity={0.7}
        >
          {item.icon != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(itemIconSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
            >
              {item.icon}
            </Text>
          ) : null}
          <View style={itemContentSurface.style as ViewStyle | undefined}>
            <Text
              style={{
                ...sharedTextStyle,
                ...(itemLabelSurface.style as TextStyle | undefined),
              }}
            >
              {item.label}
            </Text>
            {item.description != null ? (
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(itemDescriptionSurface.style as TextStyle | undefined),
                }}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            ) : null}
          </View>
          {item.shortcut != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(itemShortcutSurface.style as TextStyle | undefined),
              }}
            >
              {item.shortcut}
            </Text>
          ) : null}
        </TouchableOpacity>
      )
    },
    [
      sharedTextStyle,
      groupHeaderSurface.style,
      groupLabelSurface.style,
      handleSelect,
      itemContentSurface.style,
      itemDescriptionSurface.style,
      itemIconSurface.style,
      itemLabelSurface.style,
      itemRowSurface.style,
      itemShortcutSurface.style,
    ],
  )

  const keyExtractor = useCallback((entry: ListEntry) => entry.key, [])

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
      testID={baseTestID}
    >
      <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close command palette">
        <Animated.View style={[backdropSurface.style as ViewStyle | undefined, { opacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                containerSurface.style as ViewStyle | undefined,
                { transform: [{ translateY }] },
                style,
              ]}
            >
              <View style={panelSurface.style as ViewStyle | undefined}>
                <View style={searchContainerSurface.style as ViewStyle | undefined}>
                  <Text
                    style={{
                      ...sharedTextStyle,
                      ...(searchIconSurface.style as TextStyle | undefined),
                    }}
                    accessibilityElementsHidden
                  >
                    Search
                  </Text>
                  <TextInput
                    ref={inputRef}
                    style={{
                      ...sharedTextStyle,
                      padding: 0,
                      ...(searchInputSurface.style as TextStyle | undefined),
                    }}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={placeholder}
                    placeholderTextColor={tokens.colors.inputPlaceholder}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="done"
                    accessibilityLabel="Search commands"
                    testID={baseTestID ? `${baseTestID}-search` : undefined}
                  />
                  {query.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => setQuery('')}
                      style={clearButtonSurface.style as ViewStyle | undefined}
                      accessibilityLabel="Clear search"
                      accessibilityRole="button"
                      testID={baseTestID ? `${baseTestID}-clear` : undefined}
                    >
                      <Text
                        style={{
                          ...sharedTextStyle,
                          ...(clearTextSurface.style as TextStyle | undefined),
                        }}
                      >
                        X
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {filteredEntries.length > 0 ? (
                  <FlatList
                    data={filteredEntries}
                    keyExtractor={keyExtractor}
                    renderItem={renderEntry}
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => (
                      <View
                        style={[
                          {
                            height: StyleSheet.hairlineWidth,
                            marginHorizontal: tokens.spacing[4],
                          },
                          separatorSurface.style as ViewStyle | undefined,
                        ]}
                      />
                    )}
                  />
                ) : (
                  <View style={emptyContainerSurface.style as ViewStyle | undefined}>
                    <Text
                      style={{
                        ...sharedTextStyle,
                        ...(emptyTextSurface.style as TextStyle | undefined),
                      }}
                    >
                      No results found
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  )
}
