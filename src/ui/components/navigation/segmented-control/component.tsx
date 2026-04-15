import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { SegmentedControlConfig } from './types'

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
    activeLabel: {
      color: tokens.colors.primaryForeground,
    },
    inactiveLabel: {
      color: tokens.colors.textMuted,
    },
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

/**
 * Config-driven segmented control. All segments visible, one selected.
 * Publishes selected value to ScreenContext under `config.id`.
 */
export function SegmentedControl({ config }: { config: SegmentedControlConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined

  const defaultValue = config.defaultValue ?? config.options[0]?.value ?? ''
  const [localValue, setLocalValue] = useState<string>(resolvedValue ?? defaultValue)

  const activeValue = resolvedValue ?? localValue
  const activeIndex = config.options.findIndex((o) => o.value === activeValue)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0

  const thumbLeft = useRef(new Animated.Value(0)).current
  const thumbWidthRef = useRef(0)
  const trackWidthRef = useRef(0)

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue)
    }
  }, [resolvedValue])

  // Publish initial value
  useEffect(() => {
    setValue(config.id, activeValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (trackWidthRef.current === 0 || config.options.length === 0) return
    const segWidth = trackWidthRef.current / config.options.length
    thumbWidthRef.current = segWidth
    Animated.spring(thumbLeft, {
      toValue: safeIndex * segWidth,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }, [safeIndex, thumbLeft, config.options.length])

  function handleSelect(optionValue: string) {
    setLocalValue(optionValue)
    setValue(config.id, optionValue)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  const styles = makeStyles(tokens)

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={styles.track}
        onLayout={(e) => {
          const newWidth = e.nativeEvent.layout.width - tokens.spacing[2] // minus 2x padding
          if (newWidth !== trackWidthRef.current) {
            trackWidthRef.current = newWidth
            const segWidth = newWidth / config.options.length
            thumbWidthRef.current = segWidth
            thumbLeft.setValue(safeIndex * segWidth)
          }
        }}
      >
        {/* Animated thumb behind segments */}
        <Animated.View
          style={[
            styles.thumb,
            {
              width: `${100 / config.options.length}%` as unknown as number,
              transform: [{ translateX: thumbLeft }],
            },
          ]}
        />

        {config.options.map((option, index) => {
          const isActive = option.value === activeValue
          return (
            <TouchableOpacity
              key={option.value}
              style={styles.segment}
              onPress={() => handleSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={option.label}
              testID={
                config.testID ? `${config.testID}-${option.value}` : `${config.id}-segment-${index}`
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
    </ComponentWrapper>
  )
}

