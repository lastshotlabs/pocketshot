import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  ScrollView,
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
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { DataTableConfig } from './types'

type SortDir = 'asc' | 'desc'

function sortData(
  rows: Record<string, unknown>[],
  key: string,
  dir: SortDir,
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av === bv) return 0
    if (av == null) return 1
    if (bv == null) return -1
    const aStr = typeof av === 'number' ? av : String(av).toLowerCase()
    const bStr = typeof bv === 'number' ? bv : String(bv).toLowerCase()
    if (aStr < bStr) return dir === 'asc' ? -1 : 1
    if (aStr > bStr) return dir === 'asc' ? 1 : -1
    return 0
  })
}

function sortIcon(colKey: string, sortKey: string | undefined, sortDir: SortDir): string {
  if (colKey !== sortKey) return '↕'
  return sortDir === 'asc' ? '↑' : '↓'
}

function TableSkeleton({
  count,
  tokens,
  columnCount,
  surface,
}: {
  count: number
  tokens: DesignTokens
  columnCount: number
  surface?: ViewStyle
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

  return (
    <View style={surface}>
      {Array.from({ length: count }, (_, rowIdx) => (
        <View
          key={rowIdx}
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: tokens.colors.divider,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: columnCount }, (_, colIdx) => (
            <Animated.View
              key={colIdx}
              style={{
                flex: 1,
                height: tokens.spacing[5],
                marginHorizontal: tokens.spacing[2],
                marginVertical: tokens.spacing[3],
                borderRadius: tokens.radius.sm,
                backgroundColor: tokens.colors.surfaceAlt,
                opacity,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

function TableEmpty({
  message,
  tokens,
  surface,
  textStyle,
}: {
  message: string
  tokens: DesignTokens
  surface?: ViewStyle
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
        surface,
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

export function DataTable({ config }: { config: DataTableConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedSortKey: string | undefined = isFromRef(config.sortKey)
    ? (() => {
        const resolved = resolveFromRef(config.sortKey, values) as unknown
        return typeof resolved === 'string' ? resolved : undefined
      })()
    : typeof config.sortKey === 'string'
      ? config.sortKey
      : undefined
  const resolvedSortDir: SortDir | undefined = isFromRef(config.sortDirection)
    ? (() => {
        const resolved = resolveFromRef(config.sortDirection, values) as unknown
        return resolved === 'asc' || resolved === 'desc' ? resolved : undefined
      })()
    : config.sortDirection === 'asc' || config.sortDirection === 'desc'
      ? config.sortDirection
      : undefined

  const [localSortKey, setLocalSortKey] = useState<string | undefined>(resolvedSortKey)
  const [localSortDir, setLocalSortDir] = useState<SortDir>(resolvedSortDir ?? 'asc')
  const { data, isLoading, error } = useComponentData<Record<string, unknown>[]>(config.data)

  const headerRowSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.headerRow as Record<string, unknown> | undefined,
  })
  const headerCellSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.headerCell as Record<string, unknown> | undefined,
  })
  const rowSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.row as Record<string, unknown> | undefined,
  })
  const cellSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.cell as Record<string, unknown> | undefined,
  })
  const emptyStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.emptyState as Record<string, unknown> | undefined,
  })
  const loadingStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.loadingState as Record<string, unknown> | undefined,
  })

  const headerTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
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
  const cellTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightRegular,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
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

  const sortedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : []
    if (!localSortKey) return rows
    return sortData(rows, localSortKey, localSortDir)
  }, [data, localSortDir, localSortKey])

  const handleHeaderPress = useCallback(
    (colKey: string, sortable: boolean) => {
      if (!sortable) return
      setLocalSortKey((prev) => {
        const newKey = colKey
        const newDir: SortDir = prev === colKey ? (localSortDir === 'asc' ? 'desc' : 'asc') : 'asc'
        setLocalSortDir(newDir)
        if (config.id) {
          setValue(`${config.id}_sortKey`, newKey)
          setValue(`${config.id}_sortDir`, newDir)
        }
        return newKey
      })
    },
    [config.id, localSortDir, setValue],
  )

  const handleRowPress = useCallback(
    async (item: Record<string, unknown>) => {
      if (!config.onRowPress) return
      setValue('__pressedRow', item)
      await dispatch(config.onRowPress)
    },
    [config.onRowPress, dispatch, setValue],
  )

  const keyExtractor = useCallback((item: Record<string, unknown>, index: number) => {
    const id = item['id'] ?? item['_id']
    return id !== undefined ? String(id) : String(index)
  }, [])

  const renderRow = useCallback(
    ({ item, index }: { item: Record<string, unknown>; index: number }) => {
      const rowBg = index % 2 === 0 ? tokens.colors.surface : tokens.colors.surfaceAlt

      const rowContent = (
        <View
          style={[
            {
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: tokens.colors.divider,
              backgroundColor: rowBg,
            },
            rowSurface.style as ViewStyle | undefined,
          ]}
        >
          {config.columns.map((col) => {
            const cellValue = item[col.key]
            const displayValue = cellValue == null ? '' : String(cellValue)
            return (
              <View
                key={col.key}
                style={[
                  {
                    paddingHorizontal: tokens.spacing[3],
                    paddingVertical: tokens.spacing[3],
                    justifyContent: 'center',
                  },
                  col.width ? { width: col.width } : { flex: col.flex ?? 1 },
                  cellSurface.style as ViewStyle | undefined,
                ]}
              >
                <Text
                  style={[
                    cellTextStyle,
                    col.align === 'center' && { textAlign: 'center' },
                    col.align === 'right' && { textAlign: 'right' },
                  ]}
                  numberOfLines={1}
                  accessibilityLabel={`${col.label}: ${displayValue}`}
                >
                  {displayValue}
                </Text>
              </View>
            )
          })}
        </View>
      )

      if (config.onRowPress) {
        return (
          <TouchableOpacity
            onPress={() => void handleRowPress(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Table row"
            testID={config.testID ? `${config.testID}-row-${index}` : `data-table-row-${index}`}
          >
            {rowContent}
          </TouchableOpacity>
        )
      }

      return rowContent
    },
    [cellSurface.style, cellTextStyle, config.columns, config.onRowPress, config.testID, handleRowPress, rowSurface.style, tokens],
  )

  const headerRow = (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: tokens.colors.surfaceAlt,
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.border,
        },
        headerRowSurface.style as ViewStyle | undefined,
      ]}
      accessibilityRole="header"
    >
      {config.columns.map((col) => {
        const isSorted = col.key === localSortKey
        const icon = sortIcon(col.key, localSortKey, localSortDir)
        const label = `${col.label}${col.sortable ? `  ${icon}` : ''}`

        if (col.sortable) {
          return (
            <TouchableOpacity
              key={col.key}
              style={[
                {
                  paddingHorizontal: tokens.spacing[3],
                  paddingVertical: tokens.spacing[3],
                },
                col.width ? { width: col.width } : { flex: col.flex ?? 1 },
                headerCellSurface.style as ViewStyle | undefined,
              ]}
              onPress={() => handleHeaderPress(col.key, true)}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${col.label}${isSorted ? `, currently ${localSortDir}ending` : ''}`}
              testID={config.testID ? `${config.testID}-header-${col.key}` : `data-table-header-${col.key}`}
            >
              <Text
                style={[
                  headerTextStyle,
                  col.align === 'center' && { textAlign: 'center' },
                  col.align === 'right' && { textAlign: 'right' },
                  isSorted && { color: tokens.colors.primary },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        }

        return (
          <View
            key={col.key}
            style={[
              {
                paddingHorizontal: tokens.spacing[3],
                paddingVertical: tokens.spacing[3],
              },
              col.width ? { width: col.width } : { flex: col.flex ?? 1 },
              headerCellSurface.style as ViewStyle | undefined,
            ]}
          >
            <Text
              style={[
                headerTextStyle,
                col.align === 'center' && { textAlign: 'center' },
                col.align === 'right' && { textAlign: 'right' },
              ]}
              numberOfLines={1}
            >
              {col.label}
            </Text>
          </View>
        )
      })}
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} style={{ flexShrink: 1 }}>
        <View>
          {config.stickyHeader ? headerRow : null}
          {isLoading && !data ? (
            <TableSkeleton
              count={config.loadingCount ?? 5}
              tokens={tokens}
              columnCount={config.columns.length}
              surface={loadingStateSurface.style as ViewStyle | undefined}
            />
          ) : error ? (
            <TableEmpty
              message="Failed to load data."
              tokens={tokens}
              surface={emptyStateSurface.style as ViewStyle | undefined}
              textStyle={cellTextStyle}
            />
          ) : (
            <FlatList
              data={sortedData}
              keyExtractor={keyExtractor}
              renderItem={renderRow}
              ListHeaderComponent={!config.stickyHeader ? headerRow : null}
              ListEmptyComponent={
                <TableEmpty
                  message={config.emptyMessage ?? 'No data'}
                  tokens={tokens}
                  surface={emptyStateSurface.style as ViewStyle | undefined}
                  textStyle={cellTextStyle}
                />
              }
              scrollEnabled={false}
              accessibilityRole="list"
              accessibilityLabel="Data table"
            />
          )}
        </View>
      </ScrollView>
    </ComponentWrapper>
  )
}
