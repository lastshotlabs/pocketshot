import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { PinInputConfig } from './types'

export function PinInput({ config }: { config: PinInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()
  const length = config.length ?? 6

  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''))
  const [focusedIndex, setFocusedIndex] = useState<number | null>(
    config.autoFocus ? 0 : null,
  )
  const [hasError, setHasError] = useState(false)

  const inputRefs = useRef<Array<TextInput | null>>(Array(length).fill(null))
  const shakeAnim = useRef(new Animated.Value(0)).current

  const styles = useMemo(() => makeStyles(tokens, length), [tokens, length])

  const fullValue = digits.join('')

  // Publish value changes to screen context
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

  // Expose shake method via screen context for external error triggering
  useEffect(() => {
    setValue(`${config.id}_shake`, triggerShake)
  }, [config.id, triggerShake, setValue])

  const handleDigitChange = useCallback(
    (index: number, text: string) => {
      // Handle paste: multi-char input distributes across boxes
      if (text.length > 1) {
        const pastedDigits = text.replace(/\D/g, '').slice(0, length).split('')
        const newDigits = [...digits]
        for (let i = 0; i < pastedDigits.length && index + i < length; i++) {
          newDigits[index + i] = pastedDigits[i]
        }
        setDigits(newDigits)

        const nextFocus = Math.min(index + pastedDigits.length, length - 1)
        inputRefs.current[nextFocus]?.focus()

        // Check completion
        if (newDigits.every((d) => d !== '')) {
          if (config.onComplete) {
            void dispatch(config.onComplete)
          }
        }
        return
      }

      // Single character
      const digit = text.replace(/\D/g, '')
      if (text !== '' && digit === '') return // Non-numeric rejected

      const newDigits = [...digits]
      newDigits[index] = digit
      setDigits(newDigits)

      if (digit !== '' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Check completion
      if (digit !== '' && newDigits.every((d) => d !== '')) {
        if (config.onComplete) {
          void dispatch(config.onComplete)
        }
      }
    },
    [digits, length, config.onComplete, dispatch],
  )

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && digits[index] === '' && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        setDigits(newDigits)
        inputRefs.current[index - 1]?.focus()
      }
    },
    [digits],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <Animated.View
          style={[
            styles.boxRow,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {Array.from({ length }).map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref
              }}
              style={[
                styles.box,
                focusedIndex === index && styles.boxFocused,
                hasError && styles.boxError,
                digits[index] !== '' && styles.boxFilled,
              ]}
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
          ))}
        </Animated.View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, length: number) {
  const boxSize = length > 6 ? 40 : 48
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[2],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    boxRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: tokens.spacing[2],
    },
    box: {
      width: boxSize,
      height: boxSize,
      borderWidth: 2,
      borderColor: tokens.colors.inputBorder,
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.colors.inputBackground,
      textAlign: 'center',
      fontSize: tokens.typography.fontSizeXl,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.inputText,
    },
    boxFocused: {
      borderColor: tokens.colors.borderFocus,
    },
    boxError: {
      borderColor: tokens.colors.error,
    },
    boxFilled: {
      borderColor: tokens.colors.primary,
      backgroundColor: tokens.colors.surface,
    },
  })
}
