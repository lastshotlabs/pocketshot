import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface FilterBarFilter {
  id: string
  label: string
  icon?: string
  count?: number
}

export interface FilterBarBaseProps {
  /** Filter definitions to render as chips. */
  filters: FilterBarFilter[]
  /** Selected filter id(s). */
  value?: string | string[]
  /** Initial selection (uncontrolled). */
  defaultValue?: string | string[]
  /** Whether multiple filters can be selected at once. */
  multiSelect?: boolean
  /** Whether to show an "All" chip. */
  showAllOption?: boolean
  /** Label for the "All" chip. */
  allLabel?: string
  /** Called when selection changes. */
  onChange?: (value: string | string[]) => void
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function normalizeValue(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value
  return [value]
}

interface FilterChipProps {
  id: string
  label: string
  icon?: string
  count?: number
  selected: boolean
  multiSelect: boolean
  tokens: DesignTokens
  chipStyle?: ViewStyle
  labelStyle?: TextStyle
  iconStyle?: TextStyle
  countBadgeStyle?: ViewStyle
  countLabelStyle?: TextStyle
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
  chipStyle,
  labelStyle,
  iconStyle,
  countBadgeStyle,
  countLabelStyle,
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
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
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
          {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: tokens.radius.full,
            paddingHorizontal: tokens.spacing[3],
            paddingVertical: tokens.spacing[2],
          },
          selected
            ? { backgroundColor: tokens.colors.primary, borderWidth: 0 }
            : {
                backgroundColor: tokens.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: tokens.colors.border,
              },
          chipStyle,
        ]}
        accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
        accessibilityLabel={label}
        accessibilityState={{ checked: selected }}
        testID={testID ?? `filter-bar-chip-${id}`}
      >
        {icon ? (
          <Text
            style={[
              { marginRight: tokens.spacing[1], fontSize: tokens.typography.fontSizeSm },
              iconStyle,
            ]}
            accessibilityElementsHidden
          >
            {icon}
          </Text>
        ) : null}
        <Text
          style={[
            {
              fontSize: tokens.typography.fontSizeSm,
              fontWeight: tokens.typography.fontWeightMedium,
              color: selected ? tokens.colors.primaryForeground : tokens.colors.textMuted,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
        {count !== undefined ? (
          <View
            style={[
              {
                borderRadius: tokens.radius.full,
                paddingHorizontal: tokens.spacing[2],
                paddingVertical: 1,
                minWidth: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? 'rgba(255,255,255,0.15)' : `${tokens.colors.primary}1A`,
                marginLeft: tokens.spacing[1],
              },
              countBadgeStyle,
            ]}
          >
            <Text
              style={[
                {
                  fontSize: tokens.typography.fontSizeXs,
                  fontWeight: tokens.typography.fontWeightSemibold,
                  color: selected ? tokens.colors.primaryForeground : tokens.colors.primary,
                },
                countLabelStyle,
              ]}
            >
              {count}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  )
}

/**
 * Standalone FilterBar — plain React props, no manifest required.
 *
 * @example
 * <FilterBarBase
 *   filters={[{ id: 'active', label: 'Active' }, { id: 'archived', label: 'Archived' }]}
 *   onChange={setSelected}
 * />
 */
export function FilterBarBase({
  filters,
  value,
  defaultValue,
  multiSelect = false,
  showAllOption = true,
  allLabel = 'All',
  onChange,
  slots,
  style,
  testID,
}: FilterBarBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = value !== undefined
  const [internal, setInternal] = useState<string[]>(normalizeValue(defaultValue))
  const selectedIds = isControlled ? normalizeValue(value) : internal

  useEffect(() => {
    if (isControlled) return
  }, [isControlled])

  const trackSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', gap: 'sm', alignItems: 'center' },
    componentSurface: slots?.track,
  })
  const chipSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'sm',
      borderRadius: 'full',
      bg: 'popover',
      border: '1px solid border',
      states: { selected: { bg: 'primary', border: '0px solid transparent' } },
    },
    componentSurface: slots?.chip,
  })
  const chipLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'muted',
      states: { selected: { color: 'primary-foreground' } },
    },
    componentSurface: slots?.chipLabel,
  })
  const chipIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: 'muted',
      states: { selected: { color: 'primary-foreground' } },
    },
    componentSurface: slots?.chipIcon,
  })
  const countBadgeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: 'full',
      states: { selected: { bg: 'primary-foreground' } },
    },
    componentSurface: slots?.countBadge,
  })
  const countLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'semibold',
      color: 'primary',
      states: { selected: { color: 'primary' } },
    },
    componentSurface: slots?.countLabel,
  })

  const baseChipTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    fontWeight: tokens.typography.fontWeightMedium,
  }

  const publish = useCallback(
    (next: string[]) => {
      if (!isControlled) setInternal(next)
      onChange?.(multiSelect ? next : (next[0] ?? ''))
    },
    [isControlled, multiSelect, onChange],
  )

  const handleAllPress = useCallback(() => publish([]), [publish])

  const handleChipPress = useCallback(
    (chipId: string) => {
      let next: string[]
      if (multiSelect) {
        next = selectedIds.includes(chipId)
          ? selectedIds.filter((id) => id !== chipId)
          : [...selectedIds, chipId]
      } else {
        next = selectedIds[0] === chipId ? [] : [chipId]
      }
      publish(next)
    },
    [multiSelect, publish, selectedIds],
  )

  const allSelected = selectedIds.length === 0

  const renderChip = (params: {
    chipId: string
    label: string
    icon?: string
    count?: number
    selected: boolean
    surfaceOverride?: Record<string, unknown>
    isAllChip?: boolean
  }) => {
    const activeStates: RuntimeSurfaceState[] | undefined = params.selected
      ? ['selected']
      : undefined

    return (
      <FilterChip
        id={params.chipId}
        label={params.label}
        icon={params.icon}
        count={params.count}
        selected={params.selected}
        multiSelect={multiSelect}
        tokens={tokens}
        chipStyle={
          resolveSurfacePresentation({
            tokens,
            implementationBase: chipSurface.resolvedConfigForWrapper,
            itemSurface: params.surfaceOverride,
            activeStates,
          }).style as ViewStyle | undefined
        }
        labelStyle={{
          ...baseChipTextStyle,
          ...(resolveSurfacePresentation({
            tokens,
            implementationBase: chipLabelSurface.resolvedConfigForWrapper,
            activeStates,
          }).style as TextStyle | undefined),
        }}
        iconStyle={{
          ...baseChipTextStyle,
          ...(resolveSurfacePresentation({
            tokens,
            implementationBase: chipIconSurface.resolvedConfigForWrapper,
            activeStates,
          }).style as TextStyle | undefined),
        }}
        countBadgeStyle={
          resolveSurfacePresentation({
            tokens,
            implementationBase: countBadgeSurface.resolvedConfigForWrapper,
            activeStates,
          }).style as ViewStyle | undefined
        }
        countLabelStyle={{
          ...baseChipTextStyle,
          fontSize: tokens.typography.fontSizeXs,
          fontWeight: tokens.typography.fontWeightSemibold,
          ...(resolveSurfacePresentation({
            tokens,
            implementationBase: countLabelSurface.resolvedConfigForWrapper,
            activeStates,
          }).style as TextStyle | undefined),
        }}
        onPress={params.isAllChip ? handleAllPress : handleChipPress}
        testID={testID ? `${testID}-chip-${params.chipId}` : `filter-bar-chip-${params.chipId}`}
      />
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={trackSurface.style as ViewStyle | undefined}
      style={[{ flexShrink: 1 }, style]}
      bounces={false}
      accessibilityRole={multiSelect ? undefined : 'radiogroup'}
      accessibilityLabel="Filters"
      testID={testID}
    >
      {showAllOption
        ? renderChip({
            chipId: 'all',
            label: allLabel,
            selected: allSelected,
            surfaceOverride: slots?.allChip,
            isAllChip: true,
          })
        : null}
      {filters.map((filter) => (
        <React.Fragment key={filter.id}>
          {renderChip({
            chipId: filter.id,
            label: filter.label,
            icon: filter.icon,
            count: filter.count,
            selected: selectedIds.includes(filter.id),
          })}
        </React.Fragment>
      ))}
    </ScrollView>
  )
}
