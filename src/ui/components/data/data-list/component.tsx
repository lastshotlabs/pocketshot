import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { DataListConfig } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, path: string): unknown {
  if (typeof obj !== 'object' || obj === null) return undefined
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton({ count, tokens }: { count: number; tokens: DesignTokens }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  const styles = makeSkeletonStyles(tokens)

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <Animated.View
          key={i}
          style={[styles.row, { opacity }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ))}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Inline empty state
// ---------------------------------------------------------------------------

function InlineEmptyState({ message, tokens }: { message: string; tokens: DesignTokens }) {
  const styles = makeEmptyStyles(tokens)
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Item shell
// ---------------------------------------------------------------------------

function DataListItemShell({
  item,
  itemType,
  tokens,
}: {
  item: unknown
  itemType: string
  tokens: DesignTokens
}) {
  const styles = makeItemStyles(tokens)
  // itemType is resolved by the manifest registry at runtime.
  // This shell renders the most common label field as a fallback.
  const label =
    typeof item === 'object' && item !== null
      ? String(
          (item as Record<string, unknown>).name ??
            (item as Record<string, unknown>).title ??
            (item as Record<string, unknown>).label ??
            itemType,
        )
      : itemType

  return (
    <View style={styles.item}>
      <Text style={styles.itemText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// DataList
// ---------------------------------------------------------------------------

export function DataList({ config }: { config: DataListConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue } = useScreenContext()
  const { data, isLoading, error } = useComponentData<unknown[]>(config.data)
  const styles = makeStyles(tokens)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!config.refreshable) return
    setRefreshing(true)
    await dispatch({ type: 'refresh' })
    setRefreshing(false)
  }, [config.refreshable, dispatch])

  const handleItemPress = useCallback(
    async (item: unknown) => {
      if (!config.onItemPress) return
      setValue('__pressedItem', item)
      await dispatch(config.onItemPress)
    },
    [config.onItemPress, dispatch, setValue],
  )

  const keyExtractor = useCallback(
    (item: unknown, index: number): string => {
      const key = getNestedValue(item, config.keyExtractor ?? 'id')
      return key !== undefined ? String(key) : String(index)
    },
    [config.keyExtractor],
  )

  const renderItem = useCallback(
    ({ item }: { item: unknown }) => {
      if (config.onItemPress) {
        return (
          <TouchableOpacity
            onPress={() => handleItemPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`${config.itemType} item`}
            activeOpacity={0.7}
          >
            <DataListItemShell item={item} itemType={config.itemType} tokens={tokens} />
          </TouchableOpacity>
        )
      }
      return <DataListItemShell item={item} itemType={config.itemType} tokens={tokens} />
    },
    [config.onItemPress, config.itemType, handleItemPress, tokens],
  )

  if (isLoading && !data) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <LoadingSkeleton count={config.loadingCount ?? 3} tokens={tokens} />
      </ComponentWrapper>
    )
  }

  if (error) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <InlineEmptyState message="Failed to load data." tokens={tokens} />
      </ComponentWrapper>
    )
  }

  const items = Array.isArray(data) ? data : []

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={config.numColumns}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : undefined}
        ListEmptyComponent={
          <InlineEmptyState message={config.emptyMessage ?? 'Nothing here yet'} tokens={tokens} />
        }
        refreshControl={
          config.refreshable ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tokens.colors.primary}
            />
          ) : undefined
        }
        accessibilityRole="list"
        accessibilityLabel={`${config.itemType} list`}
      />
    </ComponentWrapper>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(_tokens: DesignTokens) {
  return StyleSheet.create({
    emptyContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })
}

function makeSkeletonStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[2],
    },
    row: {
      height: 48,
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.colors.surfaceAlt,
      marginBottom: tokens.spacing[3],
    },
  })
}

function makeEmptyStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      padding: tokens.spacing[8],
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
    },
  })
}

function makeItemStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    item: {
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[4],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    itemText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
  })
}
