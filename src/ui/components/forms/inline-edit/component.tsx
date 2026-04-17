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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { InlineEditConfig } from './types'

const KEYBOARD_TYPE_MAP = {
  text: 'default',
  number: 'numeric',
  email: 'email-address',
} as const

function resolveSlotSurface(
  config: InlineEditConfig,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface:
      (config.slots as Record<string, Record<string, unknown> | undefined> | undefined)?.[slot],
  })
}

function mergeTextStyle(
  sharedTextStyle: TextStyle,
  surface: ReturnType<typeof resolveSurfacePresentation>,
): TextStyle {
  return {
    ...sharedTextStyle,
    ...(surface.style as TextStyle | undefined),
  }
}

export function InlineEdit({ config }: { config: InlineEditConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const resolvedValue =
    config.value != null ? String(resolveFromRef(config.value, values) ?? '') : undefined
  const placeholder =
    config.placeholder != null
      ? String(resolveFromRef(config.placeholder, values) ?? '')
      : 'Click to edit'
  const prefix =
    config.prefix != null ? String(resolveFromRef(config.prefix, values) ?? '') : undefined
  const suffix =
    config.suffix != null ? String(resolveFromRef(config.suffix, values) ?? '') : undefined
  const emptyText =
    config.emptyText != null ? String(resolveFromRef(config.emptyText, values) ?? '') : '-'

  const committed = resolvedValue ?? config.defaultValue ?? ''
  const [editValue, setEditValue] = useState<string>(committed)
  const [isEditing, setIsEditing] = useState(false)
  const [isPressedIn, setIsPressedIn] = useState(false)
  const inputRef = useRef<RNTextInput>(null)
  const bgAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (resolvedValue != null && !isEditing) {
      setEditValue(resolvedValue)
    }
  }, [isEditing, resolvedValue])

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isPressedIn ? 1 : 0,
      duration: 100,
      useNativeDriver: false,
    }).start()
  }, [bgAnim, isPressedIn])

  const displayText = committed.length > 0 ? committed : emptyText
  const isEmpty = committed.length === 0
  const testId = config.testID ?? config.id

  const displayContainerSurface = resolveSlotSurface(config, tokens, 'displayContainer', {
    borderRadius: 'sm',
    paddingX: 'xs',
    paddingY: 'xs',
  })
  const displayRowSurface = resolveSlotSurface(config, tokens, 'displayRow', {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 'xs',
  })
  const displayTextSurface = resolveSlotSurface(config, tokens, 'displayText', {
    color: 'foreground',
    fontSize: 'base',
    paddingY: 'xs',
    flex: 1,
  })
  const emptyTextSurface = resolveSlotSurface(config, tokens, 'emptyText', {
    color: 'muted',
    fontSize: 'base',
  })
  const editIconSurface = resolveSlotSurface(config, tokens, 'editIcon', {
    color: 'muted',
    fontSize: 'sm',
    marginLeft: 'xs',
  })
  const affixSurface = resolveSlotSurface(config, tokens, 'affix', {
    color: 'muted',
    fontSize: 'base',
    fontWeight: 'medium',
  })
  const editContainerSurface = resolveSlotSurface(config, tokens, 'editContainer', {
    gap: 'xs',
  })
  const editRowSurface = resolveSlotSurface(config, tokens, 'editRow', {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.inputBackground,
    borderWidth: 2,
    borderColor: tokens.colors.borderFocus,
    borderRadius: 'md',
    paddingX: 'sm',
  })
  const editInputSurface = resolveSlotSurface(config, tokens, 'editInput', {
    color: tokens.colors.inputText,
    fontSize: 'base',
    flex: 1,
    paddingY: 'sm',
  })
  const editActionsSurface = resolveSlotSurface(config, tokens, 'editActions', {
    flexDirection: 'row',
    gap: 'sm',
    justifyContent: 'end',
  })
  const actionButtonSurface = resolveSlotSurface(config, tokens, 'actionButton', {
    paddingX: 'sm',
    paddingY: 'xs',
  })
  const confirmTextSurface = resolveSlotSurface(config, tokens, 'confirmText', {
    color: 'success',
    fontSize: 'base',
    fontWeight: 'bold',
  })
  const cancelTextSurface = resolveSlotSurface(config, tokens, 'cancelText', {
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
    setValue(config.id, trimmed)
    setIsEditing(false)
    if (config.onSaveAction != null) {
      void dispatch(config.onSaveAction)
    }
  }, [config.id, config.onSaveAction, dispatch, editValue, setValue])

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
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={editContainerSurface.style as ViewStyle | undefined}>
          <View style={editRowSurface.style as ViewStyle | undefined}>
            {prefix != null ? <Text style={mergeTextStyle(sharedTextStyle, affixSurface)}>{prefix}</Text> : null}
            <RNTextInput
              ref={inputRef}
              style={editInputSurface.style as TextStyle | undefined}
              value={editValue}
              onChangeText={setEditValue}
              onBlur={handleConfirm}
              onSubmitEditing={handleConfirm}
              keyboardType={KEYBOARD_TYPE_MAP[config.inputType ?? 'text']}
              autoCapitalize={config.inputType === 'email' ? 'none' : 'sentences'}
              placeholder={placeholder}
              placeholderTextColor={tokens.colors.inputPlaceholder}
              returnKeyType="done"
              accessibilityLabel={`Edit ${config.id}`}
              testID={config.testID ? `${config.testID}-input` : `${config.id}-input`}
            />
            {suffix != null ? <Text style={mergeTextStyle(sharedTextStyle, affixSurface)}>{suffix}</Text> : null}
          </View>

          <View style={editActionsSurface.style as ViewStyle | undefined}>
            <TouchableOpacity
              style={actionButtonSurface.style as ViewStyle | undefined}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm edit"
              testID={config.testID ? `${config.testID}-confirm` : `${config.id}-confirm`}
              activeOpacity={0.7}
            >
              <Text style={mergeTextStyle(sharedTextStyle, confirmTextSurface)}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={actionButtonSurface.style as ViewStyle | undefined}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel edit"
              testID={config.testID ? `${config.testID}-cancel` : `${config.id}-cancel`}
              activeOpacity={0.7}
            >
              <Text style={mergeTextStyle(sharedTextStyle, cancelTextSurface)}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={handleStartEdit}
        onPressIn={() => setIsPressedIn(true)}
        onPressOut={() => setIsPressedIn(false)}
        accessibilityRole="button"
        accessibilityLabel={`${displayText}. Tap to edit.`}
        accessibilityHint="Double tap to enter edit mode"
        testID={testId}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            displayContainerSurface.style as ViewStyle | undefined,
            { backgroundColor: animatedBackground },
          ]}
        >
          <View style={displayRowSurface.style as ViewStyle | undefined}>
            {prefix != null ? <Text style={mergeTextStyle(sharedTextStyle, affixSurface)}>{prefix}</Text> : null}
            <Text
              style={[
                mergeTextStyle(sharedTextStyle, displayTextSurface),
                isEmpty ? mergeTextStyle(sharedTextStyle, emptyTextSurface) : null,
              ]}
              numberOfLines={1}
            >
              {displayText}
            </Text>
            {suffix != null && !isEmpty ? (
              <Text style={mergeTextStyle(sharedTextStyle, affixSurface)}>{suffix}</Text>
            ) : null}
            <Text style={mergeTextStyle(sharedTextStyle, editIconSurface)}>Edit</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
