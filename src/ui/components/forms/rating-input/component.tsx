import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { RatingInputConfig } from './types'

const SIZE_MAP = {
  sm: { star: 20, gap: 4 },
  md: { star: 28, gap: 6 },
  lg: { star: 36, gap: 8 },
} as const

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

  // One scale animation per star
  const scaleAnims = useRef<Animated.Value[]>(
    Array.from({ length: maxStars }, () => new Animated.Value(1)),
  ).current

  useEffect(() => {
    if (resolvedValue != null) {
      setRating(resolvedValue)
    }
  }, [resolvedValue])

  const styles = useMemo(() => makeStyles(tokens, size), [tokens, size])

  const handlePress = useCallback(
    (starIndex: number) => {
      if (readOnly) return

      const newValue = allowHalf ? starIndex + 0.5 : starIndex + 1
      // If tapping the same star, toggle it off
      const finalValue = newValue === rating ? 0 : newValue

      // Animate the tapped star
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
    [readOnly, allowHalf, rating, scaleAnims, config.id, config.onChangeAction, setValue, dispatch],
  )

  const sizeConfig = SIZE_MAP[size]
  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <View style={styles.starsRow}>
          {Array.from({ length: maxStars }, (_, i) => {
            const filled = rating >= i + 1
            const halfFilled = allowHalf && !filled && rating >= i + 0.5

            return (
              <Animated.View
                key={i}
                style={{ transform: [{ scale: scaleAnims[i]! }] }}
              >
                <TouchableOpacity
                  onPress={() => handlePress(i)}
                  disabled={readOnly}
                  activeOpacity={readOnly ? 1 : 0.7}
                  hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1} star${i === 0 ? '' : 's'}`}
                  accessibilityState={{ selected: filled || halfFilled }}
                  accessibilityHint={readOnly ? undefined : 'Tap to rate'}
                  testID={`${testIDBase}-star-${i}`}
                >
                  <Text
                    style={[
                      styles.star,
                      {
                        fontSize: sizeConfig.star,
                        color: filled || halfFilled
                          ? tokens.colors.warning
                          : tokens.colors.inputBorder,
                      },
                    ]}
                  >
                    {filled ? '★' : halfFilled ? '⯨' : '☆'}
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

function makeStyles(tokens: DesignTokens, size: 'sm' | 'md' | 'lg') {
  const sizeConfig = SIZE_MAP[size]

  return StyleSheet.create({
    container: {
      gap: tokens.spacing[2],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizeConfig.gap,
    },
    star: {
      lineHeight: sizeConfig.star + 4,
    },
  })
}
