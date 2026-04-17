import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  PanResponder,
  type LayoutChangeEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { SliderConfig } from './types'

const THUMB_RADIUS = 12

function snapToStep(raw: number, min: number, step: number): number {
  return Math.round((raw - min) / step) * step + min
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

interface CustomSliderProps {
  config: SliderConfig
  value: number
  min: number
  max: number
  step: number
  onValueChange: (value: number) => void
  onSlidingComplete: (value: number) => void
}

function CustomSlider({
  config,
  value,
  min,
  max,
  step,
  onValueChange,
  onSlidingComplete,
}: CustomSliderProps) {
  const tokens = useTokens()
  const [trackWidth, setTrackWidth] = useState(0)
  const [dragging, setDragging] = useState(false)
  const currentValueRef = useRef(value)
  const startValueRef = useRef(value)
  currentValueRef.current = value

  const computeValue = useCallback(
    (dx: number, startValue: number): number => {
      if (trackWidth === 0) return startValue
      const range = max - min
      if (range <= 0) return min
      const delta = (dx / trackWidth) * range
      const raw = startValue + delta
      const stepped = snapToStep(raw, min, step)
      return clamp(stepped, min, max)
    },
    [max, min, step, trackWidth],
  )

  const activeStates: RuntimeSurfaceState[] | undefined = dragging ? ['active'] : undefined

  const trackContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: THUMB_RADIUS * 2 + 8,
      justifyContent: 'center',
    },
    componentSurface: config.slots?.trackContainer as Record<string, unknown> | undefined,
    activeStates,
  })
  const trackSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: 4,
      bg: 'border',
      borderRadius: 'full',
      overflow: 'hidden',
    },
    componentSurface: config.slots?.track as Record<string, unknown> | undefined,
    activeStates,
  })
  const fillSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: 4,
      bg: 'primary',
      borderRadius: 'full',
    },
    componentSurface: config.slots?.fill as Record<string, unknown> | undefined,
    activeStates,
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
      states: {
        active: {
          shadow: 'lg',
        },
      },
    },
    componentSurface: config.slots?.thumb as Record<string, unknown> | undefined,
    activeStates,
  })

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startValueRef.current = currentValueRef.current
        setDragging(true)
      },
      onPanResponderMove: (_, gestureState) => {
        const nextValue = computeValue(gestureState.dx, startValueRef.current)
        onValueChange(nextValue)
      },
      onPanResponderRelease: (_, gestureState) => {
        const nextValue = computeValue(gestureState.dx, startValueRef.current)
        setDragging(false)
        onSlidingComplete(nextValue)
      },
      onPanResponderTerminate: (_, gestureState) => {
        const nextValue = computeValue(gestureState.dx, startValueRef.current)
        setDragging(false)
        onSlidingComplete(nextValue)
      },
    }),
  ).current

  function handleTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width)
  }

  const ratio = trackWidth > 0 && max > min ? (value - min) / (max - min) : 0
  const thumbPosition = ratio * trackWidth

  return (
    <View
      style={trackContainerSurface.style as ViewStyle | undefined}
      onLayout={handleTrackLayout}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={config.label ?? config.id}
      accessibilityValue={{ min, max, now: value }}
      testID={config.testID ?? config.id}
      {...panResponder.panHandlers}
    >
      <View style={trackSurface.style as ViewStyle | undefined}>
        <View
          style={{
            ...(fillSurface.style as ViewStyle | undefined),
            width: thumbPosition,
          }}
        />
      </View>
      <View
        style={{
          ...(thumbSurface.style as ViewStyle | undefined),
          left: thumbPosition - THUMB_RADIUS,
        }}
      />
    </View>
  )
}

export function Slider({ config }: { config: SliderConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const initialValue = (resolvedValue as number | undefined) ?? config.defaultValue ?? config.min ?? 0
  const [localValue, setLocalValue] = useState<number>(initialValue)
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const showValue = config.showValue ?? true

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as number)
    }
  }, [resolvedValue])

  const activeStates: RuntimeSurfaceState[] | undefined =
    showValue ? ['selected'] : undefined

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
    activeStates,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
    },
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })
  const valueTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'primary',
    },
    componentSurface: config.slots?.valueText as Record<string, unknown> | undefined,
    activeStates,
  })

  function handleValueChange(nextValue: number) {
    setLocalValue(nextValue)
    setValue(config.id, nextValue)
  }

  function handleSlidingComplete(nextValue: number) {
    setLocalValue(nextValue)
    setValue(config.id, nextValue)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  const displayValue = Math.round(localValue * 100) / 100

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        <View style={headerSurface.style as ViewStyle | undefined}>
          {config.label != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(labelSurface.style as TextStyle | undefined),
              }}
            >
              {config.label}
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

        <CustomSlider
          config={config}
          value={localValue}
          min={config.min ?? 0}
          max={config.max ?? 100}
          step={config.step ?? 1}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
        />
      </View>
    </ComponentWrapper>
  )
}
