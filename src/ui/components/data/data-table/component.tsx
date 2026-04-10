import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  ScrollView,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { DataTableConfig } from './types'

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

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
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
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

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton({
  count,
  tokens,
  columnCount,
}: {
  count: number
  tokens: DesignTokens
  columnCount: number
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
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, rowIdx) => (
        <View
          key={rowIdx}
          style={{
            flexDirection: 'row',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: tokens.colors.divider,
          }}
        >
          {Array.from({ length: columnCount }, (__, colIdx) => (
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

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function TableEmpty({ message, tokens }: { message: string; tokens: DesignTokens }) {
  return (
    <View
      style={{
        padding: tokens.spacing[8],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSizeMd,
          color: tokens.colors.textMuted,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export function DataTable({ config }: { config: DataTableConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue, values } = useScreenContext()

  const resolvedSortKey: string | undefined = isFromRef(config.sortKey)
    ? resolveFromRef<string>(config.sortKey as unknown as string, values)
    : (config.sortKey as string | undefined)

  const resolvedSortDir: SortDir | undefined = isFromRef(config.sortDirection)
    ? resolveFromRef<SortDir>(config.sortDirection as unknown as SortDir, values)
    : (config.sortDirection as SortDir | undefined)

  const [localSortKey, setLocalSortKey] = useState<string | undefined>(resolvedSortKey)
  const [localSortDir, setLocalSortDir] = useState<SortDir>(resolvedSortDir ?? 'asc')

  const { data, isLoading, error } = useComponentData<Record<string, unknown>[]>(config.data)

  const sortedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : []
    if (!localSortKey) return rows
    return sortData(rows, localSortKey, localSortDir)
  }, [data, localSortKey, localSortDir])

  const styles = useMemo(() => makeStyles(tokens), [tokens])

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
    [localSortDir, config.id, setValue],
  )

  const handleRowPress = useCallback(
    async (item: Record<string, unknown>) => {
      if (!config.onRowPress) return
      setValue('__pressedRow', item)
      await dispatch(config.onRowPress)
    },
    [config.onRowPress, dispatch, setValue],
  )

  const keyExtractor = useCallback(
    (item: Record<string, unknown>, index: number) => {
      const id = item['id'] ?? item['_id']
      return id !== undefined ? String(id) : String(index)
    },
    [],
  )

  const renderRow = useCallback(
    ({ item, index }: { item: Record<string, unknown>; index: number }) => {
      const rowBg = index % 2 === 0 ? tokens.colors.surface : tokens.colors.surfaceAlt

      const rowContent = (
        <View
          style={[styles.row, { backgroundColor: rowBg }]}
        >
          {config.columns.map((col) => {
            const cellValue = item[col.key]
            const displayValue =
              cellValue === null || cellValue === undefined ? '' : String(cellValue)
            return (
              <View
                key={col.key}
                style={[
                  styles.cell,
                  col.width ? { width: col.width } : { flex: col.flex ?? 1 },
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
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
            onPress={() => handleRowPress(item)}
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
    [config.columns, config.onRowPress, config.testID, handleRowPress, styles, tokens],
  )

  const headerRow = (
    <View style={styles.headerRow} accessibilityRole="header">
      {config.columns.map((col) => {
        const isSorted = col.key === localSortKey
        const icon = sortIcon(col.key, localSortKey, localSortDir)

        return col.sortable ? (
          <TouchableOpacity
            key={col.key}
            style={[
              styles.headerCell,
              col.width ? { width: col.width } : { flex: col.flex ?? 1 },
            ]}
            onPress={() => handleHeaderPress(col.key, true)}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${col.label}${isSorted ? `, currently ${localSortDir}ending` : ''}`}
            testID={
              config.testID
                ? `${config.testID}-header-${col.key}`
                : `data-table-header-${col.key}`
            }
          >
            <Text
              style={[
                styles.headerText,
                col.align === 'center' && { textAlign: 'center' },
                col.align === 'right' && { textAlign: 'right' },
                isSorted && { color: tokens.colors.primary },
              ]}
              numberOfLines={1}
            >
              {col.label}
              {'  '}
              <Text style={styles.sortIcon}>{icon}</Text>
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            key={col.key}
            style={[
              styles.headerCell,
              col.width ? { width: col.width } : { flex: col.flex ?? 1 },
            ]}
          >
            <Text
              style={[
                styles.headerText,
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
    <ComponentWrapper id={config.id} testID={config.testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.horizontalScroll}
      >
        <View>
          {config.stickyHeader ? headerRow : null}
          {isLoading && !data ? (
            <TableSkeleton
              count={config.loadingCount}
              tokens={tokens}
              columnCount={config.columns.length}
            />
          ) : error ? (
            <TableEmpty message="Failed to load data." tokens={tokens} />
          ) : (
            <FlatList
              data={sortedData}
              keyExtractor={keyExtractor}
              renderItem={renderRow}
              stickyHeaderIndices={!config.stickyHeader ? undefined : undefined}
              ListHeaderComponent={!config.stickyHeader ? headerRow : null}
              ListEmptyComponent={
                <TableEmpty message={config.emptyMessage} tokens={tokens} />
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    horizontalScroll: {
      flexShrink: 1,
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: tokens.colors.surfaceAlt,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    headerCell: {
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
    },
    headerText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    sortIcon: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    row: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    cell: {
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      justifyContent: 'center',
    },
    cellText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
    },
  })
}
