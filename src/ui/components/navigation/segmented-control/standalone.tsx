import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface SegmentedOption {
  value: string
  label: string
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.md,
      padding: tokens.spacing[1],
      position: 'relative',
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[2],
      paddingHorizontal: tokens.spacing[3],
      zIndex: 1,
    },
    segmentLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    activeLabel: { color: tokens.colors.primaryForeground },
    inactiveLabel: { color: tokens.colors.textMuted },
    thumb: {
      position: 'absolute',
      top: tokens.spacing[1],
      bottom: tokens.spacing[1],
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.sm,
      ...tokens.shadows.sm,
    },
  })
}

export interface SegmentedControlBaseProps {
  options: SegmentedOption[]
  /** Controlled value. */
  value?: string
  /** Default uncontrolled value. */
  defaultValue?: string
  /** Called when selection changes. */
  onChange?: (value: string) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone SegmentedControl — plain React props, no manifest required.
 *
 * @example
 * <SegmentedControlBase
 *   options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
 *   onChange={setValue}
 * />
 */
export function SegmentedControlBase({
  options,
  value,
  defaultValue,
  onChange,
  style,
  testID,
  id,
}: SegmentedControlBaseProps) {
  const tokens = useTokens()
  const styles = makeStyles(tokens)
  const isControlled = value !== undefined
  const [localValue, setLocalValue] = useState<string>(
    value ?? defaultValue ?? options[0]?.value ?? '',
  )
  const current = isControlled ? value : localValue

  const activeIndex = options.findIndex((o) => o.value === current)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0

  const thumbLeft = useRef(new Animated.Value(0)).current
  const trackWidthRef = useRef(0)

  useEffect(() => {
    if (trackWidthRef.current === 0 || options.length === 0) return
    const segWidth = trackWidthRef.current / options.length
    Animated.spring(thumbLeft, {
      toValue: safeIndex * segWidth,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }, [safeIndex, thumbLeft, options.length])

  const handleSelect = (optionValue: string) => {
    if (!isControlled) setLocalValue(optionValue)
    onChange?.(optionValue)
  }

  return (
    <View
      style={[styles.track, style]}
      testID={testID ?? id}
      onLayout={(e) => {
        const newWidth = e.nativeEvent.layout.width - tokens.spacing[2]
        if (newWidth !== trackWidthRef.current) {
          trackWidthRef.current = newWidth
          const segWidth = newWidth / options.length
          thumbLeft.setValue(safeIndex * segWidth)
        }
      }}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: `${100 / options.length}%` as unknown as number,
            transform: [{ translateX: thumbLeft }],
          },
        ]}
      />
      {options.map((option, index) => {
        const isActive = option.value === current
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.segment}
            onPress={() => handleSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
            testID={
              testID ? `${testID}-${option.value}` : id ? `${id}-segment-${index}` : undefined
            }
          >
            <Text
              style={[styles.segmentLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
