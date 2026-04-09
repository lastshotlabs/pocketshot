import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { SliderConfig } from './types'

// Try to load the community slider; fall back to our custom implementation
let NativeSlider: React.ComponentType<{
  value: number
  minimumValue: number
  maximumValue: number
  step: number
  minimumTrackTintColor: string
  maximumTrackTintColor: string
  thumbTintColor: string
  onValueChange: (v: number) => void
  onSlidingComplete: (v: number) => void
  disabled?: boolean
  testID?: string
  accessibilityLabel?: string
}> | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NativeSlider = require('@react-native-community/slider').default
} catch {
  NativeSlider = null
}

// ── Custom PanResponder slider ──────────────────────────────────────────────

interface CustomSliderProps {
  value: number
  min: number
  max: number
  step: number
  onValueChange: (v: number) => void
  onSlidingComplete: (v: number) => void
  tokens: DesignTokens
  testID?: string
  accessibilityLabel?: string
}

function snapToStep(raw: number, min: number, step: number): number {
  return Math.round((raw - min) / step) * step + min
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function CustomSlider({
  value,
  min,
  max,
  step,
  onValueChange,
  onSlidingComplete,
  tokens,
  testID,
  accessibilityLabel,
}: CustomSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0)
  const currentValueRef = useRef(value)
  currentValueRef.current = value

  const computeValue = useCallback(
    (dx: number, startValue: number): number => {
      if (trackWidth === 0) return startValue
      const range = max - min
      const delta = (dx / trackWidth) * range
      const raw = startValue + delta
      const stepped = snapToStep(raw, min, step)
      return clamp(stepped, min, max)
    },
    [trackWidth, min, max, step],
  )

  const startValueRef = useRef(value)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startValueRef.current = currentValueRef.current
      },
      onPanResponderMove: (_, gestureState) => {
        const next = computeValue(gestureState.dx, startValueRef.current)
        onValueChange(next)
      },
      onPanResponderRelease: (_, gestureState) => {
        const next = computeValue(gestureState.dx, startValueRef.current)
        onSlidingComplete(next)
      },
      onPanResponderTerminate: (_, gestureState) => {
        const next = computeValue(gestureState.dx, startValueRef.current)
        onSlidingComplete(next)
      },
    }),
  ).current

  function handleTrackLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width)
  }

  const ratio = trackWidth > 0 ? (value - min) / (max - min) : 0
  const thumbPosition = ratio * trackWidth

  const styles = makeCustomStyles(tokens)

  return (
    <View
      style={styles.trackContainer}
      onLayout={handleTrackLayout}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      testID={testID}
      {...panResponder.panHandlers}
    >
      {/* Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: thumbPosition }]} />
      </View>
      {/* Thumb */}
      <View style={[styles.thumb, { left: thumbPosition - THUMB_RADIUS }]} />
    </View>
  )
}

const THUMB_RADIUS = 12

function makeCustomStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    trackContainer: {
      height: THUMB_RADIUS * 2 + 8,
      justifyContent: 'center',
    },
    track: {
      height: 4,
      backgroundColor: tokens.colors.border,
      borderRadius: tokens.radius.full,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.full,
    },
    thumb: {
      position: 'absolute',
      width: THUMB_RADIUS * 2,
      height: THUMB_RADIUS * 2,
      borderRadius: THUMB_RADIUS,
      backgroundColor: tokens.colors.primaryForeground,
      borderWidth: 2,
      borderColor: tokens.colors.primary,
      shadowColor: tokens.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
  })
}

// ── Main Slider component ───────────────────────────────────────────────────

export function Slider({ config }: { config: SliderConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined

  const initial = (resolvedValue as number | undefined) ?? config.defaultValue ?? config.min ?? 0

  const [localValue, setLocalValue] = useState<number>(initial)

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as number)
    }
  }, [resolvedValue])

  const styles = makeStyles(tokens)

  function handleValueChange(v: number) {
    setLocalValue(v)
    setValue(config.id, v)
  }

  function handleSlidingComplete(v: number) {
    setLocalValue(v)
    setValue(config.id, v)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  const displayValue = Math.round(localValue * 100) / 100

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        <View style={styles.header}>
          {config.label != null && <Text style={styles.label}>{config.label}</Text>}
          {config.showValue && (
            <Text style={styles.valueText} accessibilityRole="text">
              {displayValue}
            </Text>
          )}
        </View>

        {NativeSlider != null ? (
          <NativeSlider
            value={localValue}
            minimumValue={config.min ?? 0}
            maximumValue={config.max ?? 100}
            step={config.step ?? 1}
            minimumTrackTintColor={tokens.colors.primary}
            maximumTrackTintColor={tokens.colors.border}
            thumbTintColor={tokens.colors.primaryForeground}
            onValueChange={handleValueChange}
            onSlidingComplete={handleSlidingComplete}
            testID={config.testID ?? config.id}
            accessibilityLabel={config.label ?? config.id}
          />
        ) : (
          <CustomSlider
            value={localValue}
            min={config.min ?? 0}
            max={config.max ?? 100}
            step={config.step ?? 1}
            onValueChange={handleValueChange}
            onSlidingComplete={handleSlidingComplete}
            tokens={tokens}
            testID={config.testID ?? config.id}
            accessibilityLabel={config.label ?? config.id}
          />
        )}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[2],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    valueText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}
