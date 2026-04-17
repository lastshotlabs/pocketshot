import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { FilterBarConfig } from './types'

function normalizeValue(value: string | string[] | undefined, multiSelect: boolean): string[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value
  return multiSelect ? [value] : [value]
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
          {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: tokens.radius.full,
            paddingHorizontal: tokens.spacing[3],
            paddingVertical: tokens.spacing[2],
          },
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
              {
                marginRight: tokens.spacing[1],
                fontSize: tokens.typography.fontSizeSm,
              },
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
                backgroundColor: selected
                  ? 'rgba(255,255,255,0.15)'
                  : `${tokens.colors.primary}1A`,
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

export function FilterBar({ config }: { config: FilterBarConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const isMultiSelect = Boolean(config.multiSelect)
  const showAllOption = config.showAllOption !== false
  const allLabel = config.allLabel ?? 'All'

  const controlledValue: string | string[] | undefined = isFromRef(config.value)
    ? resolveFromRef<string | string[]>(
        config.value as unknown as string | string[],
        values,
      )
    : (config.value as string | string[] | undefined)

  const resolvedSelection = useMemo(
    () => normalizeValue(controlledValue ?? config.defaultValue, isMultiSelect),
    [config.defaultValue, controlledValue, isMultiSelect],
  )
  const [selectedIds, setSelectedIds] = useState<string[]>(resolvedSelection)

  useEffect(() => {
    setSelectedIds(resolvedSelection)
  }, [resolvedSelection])

  const trackSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      gap: 'sm',
      alignItems: 'center',
    },
    componentSurface: config.slots?.track as Record<string, unknown> | undefined,
  })
  const chipSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'sm',
      borderRadius: 'full',
      bg: 'popover',
      border: '1px solid border',
      states: {
        selected: {
          bg: 'primary',
          border: '0px solid transparent',
        },
      },
    },
    componentSurface: config.slots?.chip as Record<string, unknown> | undefined,
  })
  const chipLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'muted',
      states: {
        selected: {
          color: 'primary-foreground',
        },
      },
    },
    componentSurface: config.slots?.chipLabel as Record<string, unknown> | undefined,
  })
  const chipIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: 'muted',
      states: {
        selected: {
          color: 'primary-foreground',
        },
      },
    },
    componentSurface: config.slots?.chipIcon as Record<string, unknown> | undefined,
  })
  const countBadgeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: 'full',
      states: {
        selected: {
          bg: 'primary-foreground',
        },
      },
    },
    componentSurface: config.slots?.countBadge as Record<string, unknown> | undefined,
  })
  const countLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'semibold',
      color: 'primary',
      states: {
        selected: {
          color: 'primary',
        },
      },
    },
    componentSurface: config.slots?.countLabel as Record<string, unknown> | undefined,
  })

  const baseChipTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightMedium,
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

  const publishAndDispatch = useCallback(
    async (next: string[]) => {
      const publishValue = isMultiSelect ? next : (next[0] ?? null)
      if (config.id) {
        setValue(config.id, publishValue)
      }
      if (config.onChangeAction) {
        await dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, isMultiSelect, setValue],
  )

  const handleAllPress = useCallback(async () => {
    setSelectedIds([])
    await publishAndDispatch([])
  }, [publishAndDispatch])

  const handleChipPress = useCallback(
    async (id: string) => {
      let next: string[]
      if (isMultiSelect) {
        next = selectedIds.includes(id)
          ? selectedIds.filter((currentId) => currentId !== id)
          : [...selectedIds, id]
      } else {
        next = selectedIds[0] === id ? [] : [id]
      }
      setSelectedIds(next)
      await publishAndDispatch(next)
    },
    [isMultiSelect, publishAndDispatch, selectedIds],
  )

  const allSelected = selectedIds.length === 0

  const renderChip = useCallback(
    ({
      id,
      label,
      icon,
      count,
      selected,
      surfaceOverride,
      isAllChip,
    }: {
      id: string
      label: string
      icon?: string
      count?: number
      selected: boolean
      surfaceOverride?: Record<string, unknown>
      isAllChip?: boolean
    }) => {
      const activeStates: RuntimeSurfaceState[] | undefined = selected ? ['selected'] : undefined

      return (
        <FilterChip
          id={id}
          label={label}
          icon={icon}
          count={count}
          selected={selected}
          multiSelect={isMultiSelect}
          tokens={tokens}
          chipStyle={
            resolveSurfacePresentation({
              tokens,
              implementationBase: chipSurface.resolvedConfigForWrapper,
              itemSurface: surfaceOverride,
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
          onPress={isAllChip ? (() => void handleAllPress()) : handleChipPress}
          testID={config.testID ? `${config.testID}-chip-${id}` : `filter-bar-chip-${id}`}
        />
      )
    },
    [
      baseChipTextStyle,
      chipIconSurface.resolvedConfigForWrapper,
      chipLabelSurface.resolvedConfigForWrapper,
      chipSurface.resolvedConfigForWrapper,
      config.multiSelect,
      config.testID,
      isMultiSelect,
      countBadgeSurface.resolvedConfigForWrapper,
      countLabelSurface.resolvedConfigForWrapper,
      handleAllPress,
      handleChipPress,
      tokens,
    ],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={trackSurface.style as ViewStyle | undefined}
        style={{ flexShrink: 1 }}
        bounces={false}
        accessibilityRole={isMultiSelect ? undefined : 'radiogroup'}
        accessibilityLabel="Filters"
      >
        {showAllOption
          ? renderChip({
              id: 'all',
              label: allLabel,
              selected: allSelected,
              surfaceOverride: config.slots?.allChip as Record<string, unknown> | undefined,
              isAllChip: true,
            })
          : null}
        {config.filters.map((filter) => (
          <React.Fragment key={filter.id}>
            {renderChip({
              id: filter.id,
              label: filter.label,
              icon: filter.icon,
              count: filter.count,
              selected: selectedIds.includes(filter.id),
            })}
          </React.Fragment>
        ))}
      </ScrollView>
    </ComponentWrapper>
  )
}
