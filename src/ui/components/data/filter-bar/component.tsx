import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { FilterBarConfig } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeValue(
  value: string | string[] | undefined,
  multiSelect: boolean,
): string[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value
  return multiSelect ? [value] : [value]
}

// ---------------------------------------------------------------------------
// FilterChip
// ---------------------------------------------------------------------------

interface FilterChipProps {
  id: string
  label: string
  icon?: string
  count?: number
  selected: boolean
  multiSelect: boolean
  tokens: DesignTokens
  onPress: (id: string) => void
  testID?: string
}

function FilterChip({
  id,
  label,
  icon,
  count,
  selected,
  multiSelect,
  tokens,
  onPress,
  testID,
}: FilterChipProps) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start()
  }, [scale])

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start()
  }, [scale])

  const handlePress = useCallback(() => {
    onPress(id)
  }, [id, onPress])

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.chip,
          selected
            ? {
                backgroundColor: tokens.colors.primary,
                borderWidth: 0,
              }
            : {
                backgroundColor: tokens.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: tokens.colors.border,
              },
        ]}
        accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
        accessibilityLabel={label}
        accessibilityState={{ checked: selected }}
        testID={testID ?? `filter-bar-chip-${id}`}
      >
        {icon && (
          <Text style={styles.chipIcon} accessibilityElementsHidden>
            {icon}
          </Text>
        )}
        <Text
          style={[
            styles.chipLabel,
            {
              fontSize: tokens.typography.fontSizeSm,
              color: selected ? tokens.colors.primaryForeground : tokens.colors.textMuted,
            },
          ]}
        >
          {label}
        </Text>
        {count !== undefined && (
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: selected
                  ? 'rgba(255,255,255,0.15)'
                  : `${tokens.colors.primary}1A`,
                marginLeft: 4,
              },
            ]}
          >
            <Text
              style={[
                styles.countText,
                {
                  fontSize: tokens.typography.fontSizeXs,
                  color: selected ? tokens.colors.primaryForeground : tokens.colors.primary,
                },
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

export function FilterBar({ config }: { config: FilterBarConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue, values } = useScreenContext()

  // Resolve controlled value from from-ref or direct config
  const controlledValue: string | string[] | undefined = isFromRef(config.value)
    ? resolveFromRef<string | string[]>(
        config.value as unknown as string | string[],
        values,
      )
    : (config.value as string | string[] | undefined)

  const initialSelected = useMemo(
    () => normalizeValue(controlledValue ?? config.defaultValue, config.multiSelect),
    // Only run on mount — local state owns selection after that
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected)

  const publishAndDispatch = useCallback(
    async (next: string[]) => {
      const publishValue = config.multiSelect ? next : (next[0] ?? null)
      if (config.id) {
        setValue(config.id, publishValue)
      }
      if (config.onChangeAction) {
        await dispatch(config.onChangeAction)
      }
    },
    [config.id, config.multiSelect, config.onChangeAction, dispatch, setValue],
  )

  const handleAllPress = useCallback(async () => {
    setSelectedIds([])
    await publishAndDispatch([])
  }, [publishAndDispatch])

  const handleChipPress = useCallback(
    async (id: string) => {
      let next: string[]
      if (config.multiSelect) {
        next = selectedIds.includes(id)
          ? selectedIds.filter((s) => s !== id)
          : [...selectedIds, id]
      } else {
        next = selectedIds[0] === id ? [] : [id]
      }
      setSelectedIds(next)
      await publishAndDispatch(next)
    },
    [config.multiSelect, selectedIds, publishAndDispatch],
  )

  const allSelected = selectedIds.length === 0

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing[4],
          gap: tokens.spacing[2],
          alignItems: 'center',
        }}
        style={{ flexShrink: 1 }}
        bounces={false}
        accessibilityRole="radiogroup"
        accessibilityLabel="Filters"
      >
        {config.showAllOption && (
          <FilterChip
            id="__all"
            label={config.allLabel}
            selected={allSelected}
            multiSelect={config.multiSelect}
            tokens={tokens}
            onPress={handleAllPress}
            testID={config.testID ? `${config.testID}-chip-all` : 'filter-bar-chip-all'}
          />
        )}
        {config.filters.map((filter) => (
          <FilterChip
            key={filter.id}
            id={filter.id}
            label={filter.label}
            icon={filter.icon}
            count={filter.count}
            selected={selectedIds.includes(filter.id)}
            multiSelect={config.multiSelect}
            tokens={tokens}
            onPress={handleChipPress}
            testID={
              config.testID ? `${config.testID}-chip-${filter.id}` : `filter-bar-chip-${filter.id}`
            }
          />
        ))}
      </ScrollView>
    </ComponentWrapper>
  )
}

// ---------------------------------------------------------------------------
// Static styles (not token-dependent)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipIcon: {
    marginRight: 4,
    fontSize: 14,
  },
  chipLabel: {
    fontWeight: '500',
  },
  countBadge: {
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontWeight: '600',
  },
})

