import React, { useEffect, useRef } from 'react'
import {
  Animated,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface DataListBaseProps<T = unknown> {
  /** Items to render. */
  items: T[]
  /** Description of the item type (used for a11y labels). */
  itemType?: string
  /** Property used as the React key. Supports dotted paths. */
  keyExtractor?: string
  /** Number of grid columns. */
  numColumns?: number
  /** Whether the list shows a pull-to-refresh control. */
  refreshable?: boolean
  /** Whether a refresh is currently in progress. */
  refreshing?: boolean
  /** Called when the user pulls to refresh. */
  onRefresh?: () => void | Promise<void>
  /** Called when an item is pressed. Receives the item. */
  onItemPress?: (item: T) => void
  /** Whether the list is loading and should show skeletons. */
  loading?: boolean
  /** Number of skeleton rows to show while loading. */
  loadingCount?: number
  /** Whether the list is in an error state. */
  error?: boolean
  /** Empty state message. */
  emptyMessage?: string
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  /** Custom item renderer. Defaults to label-only rendering. */
  renderItem?: (item: T, index: number) => React.ReactNode
  style?: ViewStyle
  testID?: string
  id?: string
}

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

function LoadingSkeleton({
  count,
  tokens,
  slots,
}: {
  count: number
  tokens: DesignTokens
  slots?: Record<string, Record<string, unknown>>
}) {
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

  const loadingStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.loadingState,
  })
  const loadingItemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.loadingItem,
  })
  const loadingBodySurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.loadingBody,
  })
  const loadingTitleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.loadingTitle,
  })

  return (
    <View
      style={[
        { paddingHorizontal: tokens.spacing[4], paddingTop: tokens.spacing[2] },
        loadingStateSurface.style as ViewStyle | undefined,
      ]}
    >
      {Array.from({ length: count }, (_, i) => (
        <Animated.View
          key={i}
          style={[
            {
              paddingVertical: tokens.spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: tokens.colors.divider,
              opacity,
            },
            loadingItemSurface.style as ViewStyle | undefined,
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View
            style={[{ gap: tokens.spacing[2] }, loadingBodySurface.style as ViewStyle | undefined]}
          >
            <View
              style={[
                {
                  width: '65%',
                  height: 12,
                  borderRadius: tokens.radius.sm,
                  backgroundColor: tokens.colors.surfaceAlt,
                },
                loadingTitleSurface.style as ViewStyle | undefined,
              ]}
            />
            <View
              style={{
                width: '90%',
                height: 10,
                borderRadius: tokens.radius.sm,
                backgroundColor: tokens.colors.surfaceAlt,
              }}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  )
}

function InlineState({
  message,
  tokens,
  surface,
  textStyle,
}: {
  message: string
  tokens: DesignTokens
  surface?: Record<string, unknown>
  textStyle?: TextStyle
}) {
  return (
    <View
      style={[
        { padding: tokens.spacing[8], alignItems: 'center', justifyContent: 'center' },
        surface as ViewStyle | undefined,
      ]}
    >
      <Text
        style={[
          {
            fontSize: tokens.typography.fontSizeMd,
            color: tokens.colors.textMuted,
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {message}
      </Text>
    </View>
  )
}

function DataListItemShell({
  item,
  itemType,
  tokens,
  slots,
}: {
  item: unknown
  itemType: string
  tokens: DesignTokens
  slots?: Record<string, Record<string, unknown>>
}) {
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const itemSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.item })
  const itemBodySurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.itemBody })
  const itemTitleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.itemTitle,
  })
  const dividerSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.divider })

  const label =
    typeof item === 'object' && item !== null
      ? String(
          (item as Record<string, unknown>).name ??
            (item as Record<string, unknown>).title ??
            (item as Record<string, unknown>).label ??
            itemType,
        )
      : itemType

  const titleStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.text,
  }

  return (
    <View
      style={[
        {
          paddingVertical: tokens.spacing[3],
          paddingHorizontal: tokens.spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.divider,
        },
        dividerSurface.style as ViewStyle | undefined,
        itemSurface.style as ViewStyle | undefined,
      ]}
    >
      <View style={itemBodySurface.style as ViewStyle | undefined}>
        <Text
          style={[titleStyle, itemTitleSurface.style as TextStyle | undefined]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  )
}

/**
 * Standalone DataList — plain React props, no manifest required.
 *
 * @example
 * <DataListBase items={[{ id: 1, name: 'Ada' }]} itemType="users" />
 */
export function DataListBase<T = unknown>({
  items,
  itemType = 'items',
  keyExtractor: keyExtractorPath = 'id',
  numColumns,
  refreshable,
  refreshing = false,
  onRefresh,
  onItemPress,
  loading,
  loadingCount = 3,
  error,
  emptyMessage = 'Nothing here yet',
  slots,
  renderItem,
  style,
  testID,
}: DataListBaseProps<T>) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const listSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.list })
  const itemLinkSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.itemLink })
  const emptyStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.emptyState,
  })
  const errorStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.errorState,
  })

  const stateTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  }

  const itemKey = (item: T, index: number): string => {
    const key = getNestedValue(item, keyExtractorPath)
    return key !== undefined ? String(key) : String(index)
  }

  const renderRow = ({ item, index }: { item: T; index: number }) => {
    const content = renderItem ? (
      renderItem(item, index)
    ) : (
      <DataListItemShell item={item} itemType={itemType} tokens={tokens} slots={slots} />
    )

    if (onItemPress) {
      return (
        <TouchableOpacity
          onPress={() => onItemPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${itemType} item`}
          activeOpacity={0.7}
          style={itemLinkSurface.style as ViewStyle | undefined}
        >
          {content}
        </TouchableOpacity>
      )
    }
    return <>{content}</>
  }

  if (loading && items.length === 0) {
    return (
      <View style={style} testID={testID}>
        <LoadingSkeleton count={loadingCount} tokens={tokens} slots={slots} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={style} testID={testID}>
        <InlineState
          message="Failed to load data."
          tokens={tokens}
          surface={errorStateSurface.style}
          textStyle={stateTextStyle}
        />
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={itemKey}
      renderItem={renderRow}
      numColumns={numColumns}
      style={[listSurface.style as ViewStyle | undefined, style]}
      contentContainerStyle={
        items.length === 0
          ? ({ flexGrow: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle)
          : undefined
      }
      ListEmptyComponent={
        <InlineState
          message={emptyMessage}
          tokens={tokens}
          surface={emptyStateSurface.style}
          textStyle={stateTextStyle}
        />
      }
      refreshControl={
        refreshable && onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary}
          />
        ) : undefined
      }
      accessibilityRole="list"
      accessibilityLabel={`${itemType} list`}
      testID={testID}
    />
  )
}
