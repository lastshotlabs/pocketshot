import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type InlineEditInputType = 'text' | 'number' | 'email'

const KEYBOARD_TYPE_MAP = {
  text: 'default',
  number: 'numeric',
  email: 'email-address',
} as const

export interface InlineEditBaseProps {
  /** Controlled committed value. */
  value?: string
  /** Initial committed value when uncontrolled. */
  defaultValue?: string
  /** Called when the user saves the edit. */
  onSave?: (value: string) => void
  /** Placeholder shown inside the input while editing. */
  placeholder?: string
  /** Prefix shown before the value (display + edit). */
  prefix?: string
  /** Suffix shown after the value (display + edit). */
  suffix?: string
  /** Text shown when the value is empty. */
  emptyText?: string
  /** Input type — drives keyboard + autoCapitalize. */
  inputType?: InlineEditInputType
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone InlineEdit — click-to-edit text with save/cancel.
 *
 * @example
 * <InlineEditBase value={name} onSave={setName} placeholder="Add a name" />
 */
export function InlineEditBase({
  value,
  defaultValue,
  onSave,
  placeholder = 'Click to edit',
  prefix,
  suffix,
  emptyText = '-',
  inputType = 'text',
  slots,
  style,
  testID,
  id,
}: InlineEditBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '')
  const committed = isControlled ? (value ?? '') : internalValue

  const [editValue, setEditValue] = useState<string>(committed)
  const [isEditing, setIsEditing] = useState(false)
  const [isPressedIn, setIsPressedIn] = useState(false)
  const inputRef = useRef<RNTextInput>(null)
  const bgAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isEditing) setEditValue(committed)
  }, [committed, isEditing])

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isPressedIn ? 1 : 0,
      duration: 100,
      useNativeDriver: false,
    }).start()
  }, [bgAnim, isPressedIn])

  const displayText = committed.length > 0 ? committed : emptyText
  const isEmpty = committed.length === 0
  const testIDBase = testID ?? id

  function resolveSlotSurface(slot: string, implementationBase?: Record<string, unknown>) {
    return resolveSurfacePresentation({
      tokens,
      implementationBase,
      componentSurface: slots?.[slot],
    })
  }

  function mergeText(surface: ReturnType<typeof resolveSurfacePresentation>): TextStyle {
    return { ...sharedTextStyle, ...(surface.style as TextStyle | undefined) }
  }

  const displayContainerSurface = resolveSlotSurface('displayContainer', {
    borderRadius: 'sm',
    paddingX: 'xs',
    paddingY: 'xs',
  })
  const displayRowSurface = resolveSlotSurface('displayRow', {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 'xs',
  })
  const displayTextSurface = resolveSlotSurface('displayText', {
    color: 'foreground',
    fontSize: 'base',
    paddingY: 'xs',
    flex: 1,
  })
  const emptyTextSurface = resolveSlotSurface('emptyText', {
    color: 'muted',
    fontSize: 'base',
  })
  const editIconSurface = resolveSlotSurface('editIcon', {
    color: 'muted',
    fontSize: 'sm',
    marginLeft: 'xs',
  })
  const affixSurface = resolveSlotSurface('affix', {
    color: 'muted',
    fontSize: 'base',
    fontWeight: 'medium',
  })
  const editContainerSurface = resolveSlotSurface('editContainer', { gap: 'xs' })
  const editRowSurface = resolveSlotSurface('editRow', {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.inputBackground,
    borderWidth: 2,
    borderColor: tokens.colors.borderFocus,
    borderRadius: 'md',
    paddingX: 'sm',
  })
  const editInputSurface = resolveSlotSurface('editInput', {
    color: tokens.colors.inputText,
    fontSize: 'base',
    flex: 1,
    paddingY: 'sm',
  })
  const editActionsSurface = resolveSlotSurface('editActions', {
    flexDirection: 'row',
    gap: 'sm',
    justifyContent: 'end',
  })
  const actionButtonSurface = resolveSlotSurface('actionButton', {
    paddingX: 'sm',
    paddingY: 'xs',
  })
  const confirmTextSurface = resolveSlotSurface('confirmText', {
    color: 'success',
    fontSize: 'base',
    fontWeight: 'bold',
  })
  const cancelTextSurface = resolveSlotSurface('cancelText', {
    color: 'error',
    fontSize: 'base',
    fontWeight: 'bold',
  })

  const handleStartEdit = useCallback(() => {
    setEditValue(committed)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [committed])

  const handleConfirm = useCallback(() => {
    const trimmed = editValue.trim()
    if (!isControlled) setInternalValue(trimmed)
    setIsEditing(false)
    onSave?.(trimmed)
  }, [editValue, isControlled, onSave])

  const handleCancel = useCallback(() => {
    setEditValue(committed)
    setIsEditing(false)
  }, [committed])

  const animatedBackground = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', tokens.colors.surfaceAlt],
  })

  if (isEditing) {
    return (
      <View style={[editContainerSurface.style as ViewStyle | undefined, style]}>
        <View style={editRowSurface.style as ViewStyle | undefined}>
          {prefix != null ? <Text style={mergeText(affixSurface)}>{prefix}</Text> : null}
          <RNTextInput
            ref={inputRef}
            style={editInputSurface.style as TextStyle | undefined}
            value={editValue}
            onChangeText={setEditValue}
            onBlur={handleConfirm}
            onSubmitEditing={handleConfirm}
            keyboardType={KEYBOARD_TYPE_MAP[inputType]}
            autoCapitalize={inputType === 'email' ? 'none' : 'sentences'}
            placeholder={placeholder}
            placeholderTextColor={tokens.colors.inputPlaceholder}
            returnKeyType="done"
            accessibilityLabel={`Edit ${id ?? ''}`}
            testID={testIDBase ? `${testIDBase}-input` : undefined}
          />
          {suffix != null ? <Text style={mergeText(affixSurface)}>{suffix}</Text> : null}
        </View>

        <View style={editActionsSurface.style as ViewStyle | undefined}>
          <TouchableOpacity
            style={actionButtonSurface.style as ViewStyle | undefined}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm edit"
            testID={testIDBase ? `${testIDBase}-confirm` : undefined}
            activeOpacity={0.7}
          >
            <Text style={mergeText(confirmTextSurface)}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={actionButtonSurface.style as ViewStyle | undefined}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel edit"
            testID={testIDBase ? `${testIDBase}-cancel` : undefined}
            activeOpacity={0.7}
          >
            <Text style={mergeText(cancelTextSurface)}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <TouchableOpacity
      onPress={handleStartEdit}
      onPressIn={() => setIsPressedIn(true)}
      onPressOut={() => setIsPressedIn(false)}
      accessibilityRole="button"
      accessibilityLabel={`${displayText}. Tap to edit.`}
      accessibilityHint="Double tap to enter edit mode"
      testID={testIDBase}
      activeOpacity={1}
      style={style}
    >
      <Animated.View
        style={[
          displayContainerSurface.style as ViewStyle | undefined,
          { backgroundColor: animatedBackground },
        ]}
      >
        <View style={displayRowSurface.style as ViewStyle | undefined}>
          {prefix != null ? <Text style={mergeText(affixSurface)}>{prefix}</Text> : null}
          <Text
            style={[
              mergeText(displayTextSurface),
              isEmpty ? mergeText(emptyTextSurface) : null,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          {suffix != null && !isEmpty ? (
            <Text style={mergeText(affixSurface)}>{suffix}</Text>
          ) : null}
          <Text style={mergeText(editIconSurface)}>Edit</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}
