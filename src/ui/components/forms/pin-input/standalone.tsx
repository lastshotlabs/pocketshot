import React, { useCallback, useImperativeHandle, useRef, useState } from 'react'
import {
  Animated,
  Platform,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface PinInputBaseHandle {
  /** Trigger an error shake animation. */
  shake: () => void
}

export interface PinInputBaseProps {
  /** Number of digits. */
  length?: number
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called whenever the digits change. */
  onChange?: (value: string) => void
  /** Called when all digits are entered. */
  onComplete?: (value: string) => void
  /** Visible label. */
  label?: string
  /** Auto-focus the first cell. */
  autoFocus?: boolean
  /** Mask input characters. */
  secureEntry?: boolean
  /** Imperative handle for triggering a shake. */
  handleRef?: React.Ref<PinInputBaseHandle>
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone PinInput — multi-cell numeric code entry.
 *
 * @example
 * <PinInputBase length={6} onComplete={(v) => verify(v)} />
 */
export function PinInputBase({
  length = 6,
  value,
  defaultValue,
  onChange,
  onComplete,
  label,
  autoFocus,
  secureEntry,
  handleRef,
  slots,
  style,
  testID,
  id,
}: PinInputBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const initialFromValue = (value ?? defaultValue ?? '').slice(0, length)

  const [internal, setInternal] = useState<string[]>(() => {
    const arr = Array(length).fill('')
    for (let i = 0; i < initialFromValue.length; i++) arr[i] = initialFromValue[i]
    return arr
  })
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null)
  const [hasError, setHasError] = useState(false)

  const isControlled = value !== undefined
  const digits = isControlled
    ? Array.from({ length }, (_, i) => (value as string)[i] ?? '')
    : internal

  const inputRefs = useRef<Array<TextInput | null>>(Array(length).fill(null))
  const shakeAnim = useRef(new Animated.Value(0)).current
  const fullValue = digits.join('')
  const boxSize = length > 6 ? 40 : 48
  const activeStates: RuntimeSurfaceState[] | undefined = hasError ? ['invalid'] : undefined

  const triggerShake = useCallback(() => {
    setHasError(true)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => setHasError(false))
  }, [shakeAnim])

  useImperativeHandle(handleRef, () => ({ shake: triggerShake }), [triggerShake])

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
      marginBottom: 'xs',
    },
    componentSurface: slots?.label,
    activeStates,
  })
  const boxRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 'sm',
    },
    componentSurface: slots?.boxRow,
    activeStates,
  })

  const commit = useCallback(
    (next: string[]) => {
      if (!isControlled) setInternal(next)
      const joined = next.join('')
      onChange?.(joined)
      if (next.every((d) => d !== '') && onComplete) {
        onComplete(joined)
      }
    },
    [isControlled, onChange, onComplete],
  )

  const handleDigitChange = useCallback(
    (index: number, text: string) => {
      if (text.length > 1) {
        const pasted = text.replace(/\D/g, '').slice(0, length).split('')
        const next = [...digits]
        for (let offset = 0; offset < pasted.length && index + offset < length; offset += 1) {
          next[index + offset] = pasted[offset] ?? ''
        }
        commit(next)
        const nextFocus = Math.min(index + pasted.length, length - 1)
        inputRefs.current[nextFocus]?.focus()
        return
      }

      const digit = text.replace(/\D/g, '')
      if (text !== '' && digit === '') return

      const next = [...digits]
      next[index] = digit
      commit(next)

      if (digit !== '' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [commit, digits, length],
  )

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && digits[index] === '' && index > 0) {
        const next = [...digits]
        next[index - 1] = ''
        commit(next)
        inputRefs.current[index - 1]?.focus()
      }
    },
    [commit, digits],
  )

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
      <Animated.View
        style={[
          boxRowSurface.style as ViewStyle | undefined,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {Array.from({ length }).map((_, index) => {
          const boxStates: RuntimeSurfaceState[] = [
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
                focus: { border: '2px solid borderFocus' },
                invalid: { border: '2px solid error' },
                selected: { border: '2px solid primary', bg: 'card' },
              },
            },
            componentSurface: slots?.box,
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
              value={secureEntry && digits[index] !== '' ? '•' : digits[index]}
              onChangeText={(text) => handleDigitChange(index, text)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={Platform.OS === 'android' ? 1 : undefined}
              selectTextOnFocus
              caretHidden
              autoFocus={autoFocus && index === 0}
              accessibilityLabel={`${label ?? 'PIN'} digit ${index + 1} of ${length}`}
              accessibilityRole="text"
              testID={testIDBase ? `${testIDBase}-digit-${index}` : undefined}
            />
          )
        })}
      </Animated.View>
    </View>
  )
}
