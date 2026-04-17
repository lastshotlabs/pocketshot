import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { DataListConfig } from './types'

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
  config,
}: {
  count: number
  tokens: DesignTokens
  config: DataListConfig
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
    componentSurface: config.slots?.loadingState as Record<string, unknown> | undefined,
  })
  const loadingItemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.loadingItem as Record<string, unknown> | undefined,
  })
  const loadingBodySurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.loadingBody as Record<string, unknown> | undefined,
  })
  const loadingTitleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.loadingTitle as Record<string, unknown> | undefined,
  })

  return (
    <View
      style={[
        {
          paddingHorizontal: tokens.spacing[4],
          paddingTop: tokens.spacing[2],
        },
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
            style={[
              {
                gap: tokens.spacing[2],
              },
              loadingBodySurface.style as ViewStyle | undefined,
            ]}
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
        {
          padding: tokens.spacing[8],
          alignItems: 'center',
          justifyContent: 'center',
        },
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
  config,
}: {
  item: unknown
  itemType: string
  tokens: DesignTokens
  config: DataListConfig
}) {
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const itemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.item as Record<string, unknown> | undefined,
  })
  const itemBodySurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.itemBody as Record<string, unknown> | undefined,
  })
  const itemTitleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.itemTitle as Record<string, unknown> | undefined,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.divider as Record<string, unknown> | undefined,
  })

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
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeMd,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightRegular,
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
        <Text style={[titleStyle, itemTitleSurface.style as TextStyle | undefined]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  )
}

export function DataList({ config }: { config: DataListConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue } = useScreenContext()
  const { data, isLoading, error } = useComponentData<unknown[]>(config.data)
  const [refreshing, setRefreshing] = useState(false)
  const listSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.list as Record<string, unknown> | undefined,
  })
  const itemLinkSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.itemLink as Record<string, unknown> | undefined,
  })
  const emptyStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.emptyState as Record<string, unknown> | undefined,
  })
  const errorStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.errorState as Record<string, unknown> | undefined,
  })
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const stateTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeMd,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.textMuted,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightRegular,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : 'center',
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  const handleRefresh = useCallback(async () => {
    if (!config.refreshable) return
    setRefreshing(true)
    await dispatch({ type: 'refresh', target: config.id ?? 'screen' })
    setRefreshing(false)
  }, [config.id, config.refreshable, dispatch])

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
            onPress={() => void handleItemPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`${config.itemType} item`}
            activeOpacity={0.7}
            style={itemLinkSurface.style as ViewStyle | undefined}
          >
            <DataListItemShell item={item} itemType={config.itemType} tokens={tokens} config={config} />
          </TouchableOpacity>
        )
      }
      return <DataListItemShell item={item} itemType={config.itemType} tokens={tokens} config={config} />
    },
    [config, handleItemPress, itemLinkSurface.style, tokens],
  )

  if (isLoading && !data) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <LoadingSkeleton count={config.loadingCount ?? 3} tokens={tokens} config={config} />
      </ComponentWrapper>
    )
  }

  if (error) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <InlineState
          message="Failed to load data."
          tokens={tokens}
          surface={errorStateSurface.style}
          textStyle={stateTextStyle}
        />
      </ComponentWrapper>
    )
  }

  const items = Array.isArray(data) ? data : []

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={config.numColumns}
        style={listSurface.style as ViewStyle | undefined}
        contentContainerStyle={
          items.length === 0
            ? ({
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
              } as ViewStyle)
            : undefined
        }
        ListEmptyComponent={
          <InlineState
            message={config.emptyMessage ?? 'Nothing here yet'}
            tokens={tokens}
            surface={emptyStateSurface.style}
            textStyle={stateTextStyle}
          />
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
