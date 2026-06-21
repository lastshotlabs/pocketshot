import React, { useRef, useState } from 'react'
import {
  Animated,
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

export type RatingSize = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<RatingSize, { star: number; gap: 'xs' | 'sm' | 'md' }> = {
  sm: { star: 20, gap: 'xs' },
  md: { star: 28, gap: 'sm' },
  lg: { star: 36, gap: 'md' },
}

export interface RatingInputBaseProps {
  /** Controlled rating value. */
  value?: number
  /** Initial rating when uncontrolled. */
  defaultValue?: number
  /** Called when rating changes. */
  onChange?: (value: number) => void
  /** Visible label above stars. */
  label?: string
  /** Number of stars to render. */
  maxStars?: number
  /** Size of the stars. */
  size?: RatingSize
  /** Allow half-star ratings. */
  allowHalf?: boolean
  /** Render-only (no interaction). */
  readOnly?: boolean
  /** Slot overrides (container, label, starsRow, star). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone RatingInput — star rating with optional half-stars.
 *
 * @example
 * <RatingInputBase label="Rating" value={rating} onChange={setRating} />
 */
export function RatingInputBase({
  value,
  defaultValue,
  onChange,
  label,
  maxStars = 5,
  size = 'md',
  allowHalf = false,
  readOnly = false,
  slots,
  style,
  testID,
  id,
}: RatingInputBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<number>(defaultValue ?? 0)
  const isControlled = value !== undefined
  const rating = isControlled ? (value ?? 0) : internal

  const scaleAnims = useRef<Animated.Value[]>(
    Array.from({ length: maxStars }, () => new Animated.Value(1)),
  ).current

  const activeStates: RuntimeSurfaceState[] = [
    ...(rating > 0 ? (['selected'] as const) : []),
    ...(readOnly ? (['disabled'] as const) : []),
  ]

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: slots?.container,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: slots?.label,
    activeStates,
  })
  const starsRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SIZE_MAP[size].gap,
    },
    componentSurface: slots?.starsRow,
    activeStates,
  })

  function handlePress(starIndex: number) {
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

    if (!isControlled) setInternal(finalValue)
    onChange?.(finalValue)
  }

  const sizeConfig = SIZE_MAP[size]
  const testIDBase = testID ?? id

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]}>
      {label != null ? (
        <Text
          style={{ ...sharedTextStyle, ...(labelSurface.style as TextStyle | undefined) }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}
      <View style={starsRowSurface.style as ViewStyle | undefined}>
        {Array.from({ length: maxStars }, (_, index) => {
          const filled = rating >= index + 1
          const halfFilled = allowHalf && !filled && rating >= index + 0.5
          const starStates: RuntimeSurfaceState[] = [
            ...((filled || halfFilled) ? (['selected'] as const) : []),
            ...(readOnly ? (['disabled'] as const) : []),
          ]
          const starSurface = resolveSurfacePresentation({
            tokens,
            implementationBase: {
              fontSize: sizeConfig.star,
              color: filled || halfFilled ? 'warning' : 'inputBorder',
              lineHeight: sizeConfig.star + 4,
              states: { disabled: { opacity: 0.6 } },
            },
            componentSurface: slots?.star,
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
                testID={testIDBase ? `${testIDBase}-star-${index}` : undefined}
              >
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(starSurface.style as TextStyle | undefined),
                  }}
                >
                  {filled ? '★' : halfFilled ? '⯨' : '☆'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}
