import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Animated, Platform, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { PinInputConfig } from './types'

export function PinInput({ config }: { config: PinInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()
  const length = config.length ?? 6

  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''))
  const [focusedIndex, setFocusedIndex] = useState<number | null>(config.autoFocus ? 0 : null)
  const [hasError, setHasError] = useState(false)

  const inputRefs = useRef<Array<TextInput | null>>(Array(length).fill(null))
  const shakeAnim = useRef(new Animated.Value(0)).current
  const fullValue = digits.join('')
  const boxSize = length > 6 ? 40 : 48
  const activeStates: RuntimeSurfaceState[] | undefined = hasError ? ['invalid'] : undefined
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    setValue(config.id, fullValue)
  }, [config.id, fullValue, setValue])

  const triggerShake = useCallback(() => {
    setHasError(true)
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setHasError(false)
    })
  }, [shakeAnim])

  useEffect(() => {
    setValue(`${config.id}_shake`, triggerShake)
  }, [config.id, triggerShake, setValue])

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      gap: 'sm',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      marginBottom: 'xs',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })
  const boxRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 'sm',
    },
    componentSurface: config.slots?.boxRow as Record<string, unknown> | undefined,
    activeStates,
  })

  const handleDigitChange = useCallback(
    (index: number, text: string) => {
      if (text.length > 1) {
        const pastedDigits = text.replace(/\D/g, '').slice(0, length).split('')
        const nextDigits = [...digits]
        for (let offset = 0; offset < pastedDigits.length && index + offset < length; offset += 1) {
          nextDigits[index + offset] = pastedDigits[offset] ?? ''
        }
        setDigits(nextDigits)

        const nextFocus = Math.min(index + pastedDigits.length, length - 1)
        inputRefs.current[nextFocus]?.focus()

        if (nextDigits.every((digit) => digit !== '') && config.onComplete) {
          void dispatch(config.onComplete)
        }
        return
      }

      const digit = text.replace(/\D/g, '')
      if (text !== '' && digit === '') return

      const nextDigits = [...digits]
      nextDigits[index] = digit
      setDigits(nextDigits)

      if (digit !== '' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      if (digit !== '' && nextDigits.every((value) => value !== '') && config.onComplete) {
        void dispatch(config.onComplete)
      }
    },
    [config.onComplete, digits, dispatch, length],
  )

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && digits[index] === '' && index > 0) {
        const nextDigits = [...digits]
        nextDigits[index - 1] = ''
        setDigits(nextDigits)
        inputRefs.current[index - 1]?.focus()
      }
    },
    [digits],
  )

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
        <Animated.View
          style={[
            boxRowSurface.style as ViewStyle | undefined,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {Array.from({ length }).map((_, index) => {
            const boxStates: RuntimeSurfaceState[] | undefined = [
              ...(focusedIndex === index ? (['focus'] as const) : []),
              ...(hasError ? (['invalid'] as const) : []),
              ...(digits[index] !== '' ? (['selected'] as const) : []),
            ]
            const boxSurface = resolveSurfacePresentation({
              tokens,
              implementationBase: {
                width: boxSize,
                height: boxSize,
                border: '2px solid inputBorder',
                borderRadius: 'md',
                bg: 'inputBackground',
                textAlign: 'center',
                fontSize: 'xl',
                fontWeight: 'semibold',
                color: 'inputText',
                states: {
                  focus: {
                    border: '2px solid borderFocus',
                  },
                  invalid: {
                    border: '2px solid error',
                  },
                  selected: {
                    border: '2px solid primary',
                    bg: 'card',
                  },
                },
              },
              componentSurface: config.slots?.box as Record<string, unknown> | undefined,
              activeStates: boxStates,
            })

            return (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref
                }}
                style={{
                  ...sharedTextStyle,
                  ...(boxSurface.style as TextStyle | undefined),
                }}
                value={config.secureEntry && digits[index] !== '' ? '\u2022' : digits[index]}
                onChangeText={(text) => handleDigitChange(index, text)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={Platform.OS === 'android' ? 1 : undefined}
                selectTextOnFocus
                caretHidden
                autoFocus={config.autoFocus && index === 0}
                accessibilityLabel={`${config.label ?? 'PIN'} digit ${index + 1} of ${length}`}
                accessibilityRole="text"
                testID={`${config.testID ?? config.id}-digit-${index}`}
              />
            )
          })}
        </Animated.View>
      </View>
    </ComponentWrapper>
  )
}
