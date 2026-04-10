import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
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

export function InlineEdit({ config }: { config: InlineEditConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null
      ? (resolveFromRef(config.value, values) as string | undefined)
      : undefined

  const committed = resolvedValue ?? config.defaultValue
  const [editValue, setEditValue] = useState<string>(committed)
  const [isEditing, setIsEditing] = useState(false)
  const [isPressedIn, setIsPressedIn] = useState(false)
  const inputRef = useRef<RNTextInput>(null)

  const bgAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (resolvedValue != null && !isEditing) {
      setEditValue(resolvedValue)
    }
  }, [resolvedValue, isEditing])

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isPressedIn ? 1 : 0,
      duration: 100,
      useNativeDriver: false,
    }).start()
  }, [isPressedIn, bgAnim])

  const handleStartEdit = useCallback(() => {
    setEditValue(committed)
    setIsEditing(true)
    // Focus after state update
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [committed])

  const handleConfirm = useCallback(() => {
    const trimmed = editValue.trim()
    setValue(config.id, trimmed)
    setIsEditing(false)
    if (config.onSaveAction) {
      void dispatch(config.onSaveAction)
    }
  }, [editValue, config.id, config.onSaveAction, setValue, dispatch])

  const handleCancel = useCallback(() => {
    setEditValue(committed)
    setIsEditing(false)
  }, [committed])

  const handleBlur = useCallback(() => {
    // Auto-confirm on blur
    handleConfirm()
  }, [handleConfirm])

  const handleSubmitEditing = useCallback(() => {
    handleConfirm()
  }, [handleConfirm])

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const displayText = committed.length > 0 ? committed : config.emptyText
  const isEmpty = committed.length === 0

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', tokens.colors.surfaceAlt],
  })

  if (isEditing) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <View style={styles.editContainer}>
          <View style={styles.editRow}>
            {config.prefix != null && (
              <Text style={styles.affix} accessibilityRole="text">
                {config.prefix}
              </Text>
            )}
            <RNTextInput
              ref={inputRef}
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              onBlur={handleBlur}
              onSubmitEditing={handleSubmitEditing}
              keyboardType={KEYBOARD_TYPE_MAP[config.inputType ?? 'text']}
              autoCapitalize={config.inputType === 'email' ? 'none' : 'sentences'}
              returnKeyType="done"
              accessibilityLabel={`Edit ${config.id}`}
              accessibilityRole="none"
              testID={config.testID ? `${config.testID}-input` : `${config.id}-input`}
            />
            {config.suffix != null && (
              <Text style={styles.affix} accessibilityRole="text">
                {config.suffix}
              </Text>
            )}
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm edit"
              testID={config.testID ? `${config.testID}-confirm` : `${config.id}-confirm`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.confirmText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel edit"
              testID={config.testID ? `${config.testID}-cancel` : `${config.id}-cancel`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <TouchableOpacity
        onPress={handleStartEdit}
        onPressIn={() => setIsPressedIn(true)}
        onPressOut={() => setIsPressedIn(false)}
        accessibilityRole="button"
        accessibilityLabel={`${displayText}. Tap to edit.`}
        accessibilityHint="Double tap to enter edit mode"
        testID={config.testID ?? config.id}
        activeOpacity={1}
      >
        <Animated.View style={[styles.displayContainer, { backgroundColor: bgColor }]}>
          <View style={styles.displayRow}>
            {config.prefix != null && (
              <Text style={styles.affix} accessibilityRole="text">
                {config.prefix}
              </Text>
            )}
            <Text
              style={[styles.displayText, isEmpty && styles.emptyText]}
              numberOfLines={1}
            >
              {displayText}
            </Text>
            {config.suffix != null && !isEmpty && (
              <Text style={styles.affix} accessibilityRole="text">
                {config.suffix}
              </Text>
            )}
            <Text style={styles.editIcon} accessibilityRole="text">
              ✎
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    displayContainer: {
      borderRadius: tokens.radius.sm,
      paddingHorizontal: tokens.spacing[1],
      paddingVertical: tokens.spacing[1],
    },
    displayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
    },
    displayText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      paddingVertical: tokens.spacing[1],
    },
    emptyText: {
      color: tokens.colors.textMuted,
      fontStyle: 'italic',
    },
    editIcon: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginLeft: tokens.spacing[1],
    },
    affix: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    editContainer: {
      gap: tokens.spacing[1],
    },
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderWidth: 2,
      borderColor: tokens.colors.borderFocus,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[2],
    },
    editInput: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      paddingVertical: tokens.spacing[2],
    },
    editActions: {
      flexDirection: 'row',
      gap: tokens.spacing[2],
      justifyContent: 'flex-end',
    },
    actionButton: {
      paddingVertical: tokens.spacing[1],
      paddingHorizontal: tokens.spacing[2],
    },
    confirmText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.success,
    },
    cancelText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.error,
    },
  })
}
