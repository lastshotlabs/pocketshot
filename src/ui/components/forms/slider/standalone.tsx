import React, { useCallback, useRef, useState } from 'react'
import {
  PanResponder,
  Text,
  View,
  type LayoutChangeEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

const THUMB_RADIUS = 12

function snapToStep(raw: number, min: number, step: number): number {
  return Math.round((raw - min) / step) * step + min
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export interface SliderBaseProps {
  /** Controlled numeric value. */
  value?: number
  /** Initial value when uncontrolled. */
  defaultValue?: number
  /** Called continuously while the user drags. */
  onValueChange?: (value: number) => void
  /** Called once when the user releases the thumb. */
  onSlidingComplete?: (value: number) => void
  /** Visible label. */
  label?: string
  /** Show the current value beside the label. */
  showValue?: boolean
  /** Min value. */
  min?: number
  /** Max value. */
  max?: number
  /** Step granularity. */
  step?: number
  /** Slot overrides (container, header, label, valueText, trackContainer, track, fill, thumb). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Slider — drag-to-set numeric value.
 *
 * @example
 * <SliderBase label="Volume" value={vol} onValueChange={setVol} min={0} max={100} />
 */
export function SliderBase({
  value,
  defaultValue,
  onValueChange,
  onSlidingComplete,
  label,
  showValue = true,
  min = 0,
  max = 100,
  step = 1,
  slots,
  style,
  testID,
  id,
}: SliderBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<number>(defaultValue ?? min)
  const isControlled = value !== undefined
  const current = isControlled ? (value ?? min) : internal

  const [trackWidth, setTrackWidth] = useState(0)
  const [dragging, setDragging] = useState(false)
  const currentRef = useRef(current)
  const startRef = useRef(current)
  currentRef.current = current

  const computeValue = useCallback(
    (dx: number, startValue: number): number => {
      if (trackWidth === 0) return startValue
      const range = max - min
      if (range <= 0) return min
      const delta = (dx / trackWidth) * range
      const raw = startValue + delta
      return clamp(snapToStep(raw, min, step), min, max)
    },
    [max, min, step, trackWidth],
  )

  const containerStates: RuntimeSurfaceState[] | undefined = showValue
    ? ['selected']
    : undefined
  const trackStates: RuntimeSurfaceState[] | undefined = dragging ? ['active'] : undefined

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: slots?.container,
    activeStates: containerStates,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
    },
    componentSurface: slots?.header,
    activeStates: containerStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: slots?.label,
    activeStates: containerStates,
  })
  const valueTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'primary',
    },
    componentSurface: slots?.valueText,
    activeStates: containerStates,
  })
  const trackContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: THUMB_RADIUS * 2 + 8,
      justifyContent: 'center',
    },
    componentSurface: slots?.trackContainer,
    activeStates: trackStates,
  })
  const trackSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: 4,
      bg: 'border',
      borderRadius: 'full',
      overflow: 'hidden',
    },
    componentSurface: slots?.track,
    activeStates: trackStates,
  })
  const fillSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: 4,
      bg: 'primary',
      borderRadius: 'full',
    },
    componentSurface: slots?.fill,
    activeStates: trackStates,
  })
  const thumbSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      width: THUMB_RADIUS * 2,
      height: THUMB_RADIUS * 2,
      borderRadius: 'full',
      bg: 'primary-foreground',
      border: '2px solid primary',
      shadow: 'md',
      states: { active: { shadow: 'lg' } },
    },
    componentSurface: slots?.thumb,
    activeStates: trackStates,
  })

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = currentRef.current
        setDragging(true)
      },
      onPanResponderMove: (_, gestureState) => {
        const next = computeValue(gestureState.dx, startRef.current)
        if (!isControlled) setInternal(next)
        onValueChange?.(next)
      },
      onPanResponderRelease: (_, gestureState) => {
        const next = computeValue(gestureState.dx, startRef.current)
        setDragging(false)
        if (!isControlled) setInternal(next)
        onSlidingComplete?.(next)
      },
      onPanResponderTerminate: (_, gestureState) => {
        const next = computeValue(gestureState.dx, startRef.current)
        setDragging(false)
        if (!isControlled) setInternal(next)
        onSlidingComplete?.(next)
      },
    }),
  ).current

  function handleTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width)
  }

  const ratio = trackWidth > 0 && max > min ? (current - min) / (max - min) : 0
  const thumbPosition = ratio * trackWidth
  const displayValue = Math.round(current * 100) / 100

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]}>
      <View style={headerSurface.style as ViewStyle | undefined}>
        {label != null ? (
          <Text
            style={{ ...sharedTextStyle, ...(labelSurface.style as TextStyle | undefined) }}
          >
            {label}
          </Text>
        ) : null}
        {showValue ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(valueTextSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="text"
          >
            {String(displayValue)}
          </Text>
        ) : null}
      </View>
      <View
        style={trackContainerSurface.style as ViewStyle | undefined}
        onLayout={handleTrackLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label ?? id}
        accessibilityValue={{ min, max, now: current }}
        testID={testID ?? id}
        {...panResponder.panHandlers}
      >
        <View style={trackSurface.style as ViewStyle | undefined}>
          <View
            style={{ ...(fillSurface.style as ViewStyle | undefined), width: thumbPosition }}
          />
        </View>
        <View
          style={{
            ...(thumbSurface.style as ViewStyle | undefined),
            left: thumbPosition - THUMB_RADIUS,
          }}
        />
      </View>
    </View>
  )
}
