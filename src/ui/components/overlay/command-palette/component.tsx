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
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { CommandPaletteConfig } from './types'

type CommandItem = CommandPaletteConfig['items'][number]

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
  | { type: 'item'; item: CommandItem; key: string }

export function CommandPalette({ config }: { config: CommandPaletteConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()
  const [query, setQuery] = useState('')
  const inputRef = useRef<TextInput>(null)

  const isOpen = Boolean(getValue(`__commandPalette_${config.id}`))
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

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
      return
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
    ]).start()
  }, [isOpen, opacity, translateY])

  const handleClose = useCallback(() => {
    setValue(`__commandPalette_${config.id}`, false)
  }, [config.id, setValue])

  const handleSelect = useCallback(
    async (item: CommandItem) => {
      handleClose()
      await dispatch(item.onSelect)
    },
    [dispatch, handleClose],
  )

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
  }, [config.items, maxResults, query])

  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      bg: 'rgba(0,0,0,0.55)',
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
  })
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      paddingTop: '2xl',
      paddingX: 'md',
      paddingBottom: 'md',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
  })
  const searchContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'sm',
    },
    componentSurface: config.slots?.searchContainer as Record<string, unknown> | undefined,
  })
  const searchIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
      marginRight: 'xs',
    },
    componentSurface: config.slots?.searchIcon as Record<string, unknown> | undefined,
  })
  const searchInputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: config.slots?.searchInput as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.clearButton as Record<string, unknown> | undefined,
  })
  const clearTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.clearText as Record<string, unknown> | undefined,
  })
  const groupHeaderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingTop: 'sm',
      paddingBottom: 'xs',
    },
    componentSurface: config.slots?.groupHeader as Record<string, unknown> | undefined,
  })
  const groupLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'semibold',
      color: 'muted',
      letterSpacing: 'wide',
    },
    componentSurface: config.slots?.groupLabel as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.itemRow as Record<string, unknown> | undefined,
  })
  const itemIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      width: 24,
      textAlign: 'center',
    },
    componentSurface: config.slots?.itemIcon as Record<string, unknown> | undefined,
  })
  const itemContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
    },
    componentSurface: config.slots?.itemContent as Record<string, unknown> | undefined,
  })
  const itemLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: config.slots?.itemLabel as Record<string, unknown> | undefined,
  })
  const itemDescriptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginTop: 2,
    },
    componentSurface: config.slots?.itemDescription as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.itemShortcut as Record<string, unknown> | undefined,
  })
  const emptyContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'xl',
    },
    componentSurface: config.slots?.emptyContainer as Record<string, unknown> | undefined,
  })
  const emptyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.emptyText as Record<string, unknown> | undefined,
  })
  const separatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'border',
    },
    componentSurface: config.slots?.separator as Record<string, unknown> | undefined,
  })

  const renderEntry = useCallback(
    ({ item: entry }: { item: ListEntry }) => {
      if (entry.type === 'group') {
        return (
          <View style={groupHeaderSurface.style as ViewStyle | undefined}>
            <Text
              style={{
                ...baseTextStyle,
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
                ...baseTextStyle,
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
                ...baseTextStyle,
                ...(itemLabelSurface.style as TextStyle | undefined),
              }}
            >
              {item.label}
            </Text>
            {item.description != null ? (
              <Text
                style={{
                  ...baseTextStyle,
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
                ...baseTextStyle,
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
      baseTextStyle,
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
  const baseTestID = config.testID ?? config.id

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Close command palette">
          <Animated.View
            style={[
              backdropSurface.style as ViewStyle | undefined,
              { opacity },
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  containerSurface.style as ViewStyle | undefined,
                  { transform: [{ translateY }] },
                ]}
              >
                <View style={panelSurface.style as ViewStyle | undefined}>
                  <View style={searchContainerSurface.style as ViewStyle | undefined}>
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(searchIconSurface.style as TextStyle | undefined),
                      }}
                      accessibilityElementsHidden
                    >
                      Search
                    </Text>
                    <TextInput
                      ref={inputRef}
                      style={{
                        ...baseTextStyle,
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
                      testID={`${baseTestID}-search`}
                    />
                    {query.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => setQuery('')}
                        style={clearButtonSurface.style as ViewStyle | undefined}
                        accessibilityLabel="Clear search"
                        accessibilityRole="button"
                        testID={`${baseTestID}-clear`}
                      >
                        <Text
                          style={{
                            ...baseTextStyle,
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
                            { height: StyleSheet.hairlineWidth, marginHorizontal: tokens.spacing[4] },
                            separatorSurface.style as ViewStyle | undefined,
                          ]}
                        />
                      )}
                    />
                  ) : (
                    <View style={emptyContainerSurface.style as ViewStyle | undefined}>
                      <Text
                        style={{
                          ...baseTextStyle,
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
    </ComponentWrapper>
  )
}
