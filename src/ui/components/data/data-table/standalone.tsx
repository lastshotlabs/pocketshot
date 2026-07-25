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
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type DataTableSortDirection = 'asc' | 'desc'

export interface DataTableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: number
  flex?: number
  align?: 'left' | 'center' | 'right'
}

export interface DataTableBaseProps {
  /** Row data. */
  rows: Record<string, unknown>[]
  /** Column definitions. */
  columns: DataTableColumn[]
  /** Initial sort key (uncontrolled). */
  defaultSortKey?: string
  /** Initial sort direction (uncontrolled). */
  defaultSortDirection?: DataTableSortDirection
  /** Controlled sort key. */
  sortKey?: string
  /** Controlled sort direction. */
  sortDirection?: DataTableSortDirection
  /** Called when the user changes sort. */
  onSortChange?: (key: string, direction: DataTableSortDirection) => void
  /** Called when a row is pressed. */
  onRowPress?: (row: Record<string, unknown>) => void
  /** Whether to render the header outside of the scrolling list. */
  stickyHeader?: boolean
  /** Loading flag — shows a skeleton when true and rows are empty. */
  loading?: boolean
  /** Number of skeleton rows. */
  loadingCount?: number
  /** Error flag — shows the empty/error message when true. */
  error?: boolean
  /** Message rendered when no rows. */
  emptyMessage?: string
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function sortData(
  rows: Record<string, unknown>[],
  key: string,
  dir: DataTableSortDirection,
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

function sortIcon(
  colKey: string,
  sortKey: string | undefined,
  sortDir: DataTableSortDirection,
): string {
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
        { padding: tokens.spacing[8], alignItems: 'center', justifyContent: 'center' },
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

/**
 * Standalone DataTable — plain React props, no manifest required.
 *
 * @example
 * <DataTableBase rows={users} columns={[{ key: 'name', label: 'Name', sortable: true }]} />
 */
export function DataTableBase({
  rows,
  columns,
  defaultSortKey,
  defaultSortDirection = 'asc',
  sortKey,
  sortDirection,
  onSortChange,
  onRowPress,
  stickyHeader,
  loading,
  loadingCount = 5,
  error,
  emptyMessage = 'No data',
  slots,
  style,
  testID,
}: DataTableBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isSortControlled = sortKey !== undefined
  const [internalSortKey, setInternalSortKey] = useState<string | undefined>(defaultSortKey)
  const [internalSortDir, setInternalSortDir] =
    useState<DataTableSortDirection>(defaultSortDirection)
  const activeSortKey = isSortControlled ? sortKey : internalSortKey
  const activeSortDir = (sortDirection ?? internalSortDir) as DataTableSortDirection

  const headerRowSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.headerRow,
  })
  const headerCellSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.headerCell,
  })
  const rowSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.row })
  const cellSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.cell })
  const emptyStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.emptyState,
  })
  const loadingStateSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.loadingState,
  })

  const headerTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    fontWeight: tokens.typography.fontWeightSemibold,
    color: tokens.colors.text,
  }
  const cellTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.text,
  }

  const sortedRows = useMemo(() => {
    if (!activeSortKey) return rows
    return sortData(rows, activeSortKey, activeSortDir)
  }, [rows, activeSortKey, activeSortDir])

  const handleHeaderPress = useCallback(
    (colKey: string, sortable: boolean) => {
      if (!sortable) return
      const newDir: DataTableSortDirection =
        activeSortKey === colKey ? (activeSortDir === 'asc' ? 'desc' : 'asc') : 'asc'
      if (!isSortControlled) {
        setInternalSortKey(colKey)
        setInternalSortDir(newDir)
      }
      onSortChange?.(colKey, newDir)
    },
    [activeSortKey, activeSortDir, isSortControlled, onSortChange],
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
          {columns.map((col) => {
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

      if (onRowPress) {
        return (
          <TouchableOpacity
            onPress={() => onRowPress(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Table row"
            testID={testID ? `${testID}-row-${index}` : `data-table-row-${index}`}
          >
            {rowContent}
          </TouchableOpacity>
        )
      }

      return rowContent
    },
    [cellSurface.style, cellTextStyle, columns, onRowPress, rowSurface.style, testID, tokens],
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
      {columns.map((col) => {
        const isSorted = col.key === activeSortKey
        const icon = sortIcon(col.key, activeSortKey, activeSortDir)
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
              accessibilityLabel={`Sort by ${col.label}${
                isSorted ? `, currently ${activeSortDir}ending` : ''
              }`}
              testID={testID ? `${testID}-header-${col.key}` : `data-table-header-${col.key}`}
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      style={[{ flexShrink: 1 }, style]}
      testID={testID}
    >
      <View>
        {stickyHeader ? headerRow : null}
        {loading && rows.length === 0 ? (
          <TableSkeleton
            count={loadingCount}
            tokens={tokens}
            columnCount={columns.length}
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
            data={sortedRows}
            keyExtractor={keyExtractor}
            renderItem={renderRow}
            ListHeaderComponent={!stickyHeader ? headerRow : null}
            ListEmptyComponent={
              <TableEmpty
                message={emptyMessage}
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
  )
}
