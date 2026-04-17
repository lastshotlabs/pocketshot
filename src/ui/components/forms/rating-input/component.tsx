import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { RatingInputConfig } from './types'

const SIZE_MAP = {
  sm: { star: 20, gap: 'xs' as const },
  md: { star: 28, gap: 'sm' as const },
  lg: { star: 36, gap: 'md' as const },
}

export function RatingInput({ config }: { config: RatingInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as number | undefined) : undefined

  const maxStars = config.maxStars ?? 5
  const size = config.size ?? 'md'
  const allowHalf = config.allowHalf ?? false
  const readOnly = config.readOnly ?? false
  const [rating, setRating] = useState<number>(resolvedValue ?? config.defaultValue ?? 0)
  const scaleAnims = useRef<Animated.Value[]>(
    Array.from({ length: maxStars }, () => new Animated.Value(1)),
  ).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    if (resolvedValue != null) {
      setRating(resolvedValue)
    }
  }, [resolvedValue])

  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(rating > 0 ? (['selected'] as const) : []),
    ...(readOnly ? (['disabled'] as const) : []),
  ]

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
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
  const starsRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SIZE_MAP[size].gap,
    },
    componentSurface: config.slots?.starsRow as Record<string, unknown> | undefined,
    activeStates,
  })

  const handlePress = useCallback(
    (starIndex: number) => {
      if (readOnly) return

      const nextValue = allowHalf ? starIndex + 0.5 : starIndex + 1
      const finalValue = nextValue === rating ? 0 : nextValue

      Animated.sequence([
        Animated.spring(scaleAnims[starIndex]!, {
          toValue: 1.3,
          useNativeDriver: true,
          speed: 50,
          bounciness: 12,
        }),
        Animated.spring(scaleAnims[starIndex]!, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 4,
        }),
      ]).start()

      setRating(finalValue)
      setValue(config.id, finalValue)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [allowHalf, config.id, config.onChangeAction, dispatch, rating, readOnly, scaleAnims, setValue],
  )

  const sizeConfig = SIZE_MAP[size]
  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        {config.label != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(labelSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="text"
          >
            {config.label}
          </Text>
        ) : null}
        <View style={starsRowSurface.style as ViewStyle | undefined}>
          {Array.from({ length: maxStars }, (_, index) => {
            const filled = rating >= index + 1
            const halfFilled = allowHalf && !filled && rating >= index + 0.5
            const starStates: RuntimeSurfaceState[] | undefined = [
              ...((filled || halfFilled) ? (['selected'] as const) : []),
              ...(readOnly ? (['disabled'] as const) : []),
            ]
            const starSurface = resolveSurfacePresentation({
              tokens,
              implementationBase: {
                fontSize: sizeConfig.star,
                color: filled || halfFilled ? 'warning' : 'inputBorder',
                lineHeight: sizeConfig.star + 4,
                states: {
                  disabled: {
                    opacity: 0.6,
                  },
                },
              },
              componentSurface: config.slots?.star as Record<string, unknown> | undefined,
              activeStates: starStates,
            })

            return (
              <Animated.View key={index} style={{ transform: [{ scale: scaleAnims[index]! }] }}>
                <TouchableOpacity
                  onPress={() => handlePress(index)}
                  disabled={readOnly}
                  activeOpacity={readOnly ? 1 : 0.7}
                  hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1} star${index === 0 ? '' : 's'}`}
                  accessibilityState={{ selected: filled || halfFilled }}
                  accessibilityHint={readOnly ? undefined : 'Tap to rate'}
                  testID={`${testIDBase}-star-${index}`}
                >
                  <Text
                    style={{
                      ...sharedTextStyle,
                      ...(starSurface.style as TextStyle | undefined),
                    }}
                  >
                    {filled ? '\u2605' : halfFilled ? '\u2BE8' : '\u2606'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>
      </View>
    </ComponentWrapper>
  )
}
