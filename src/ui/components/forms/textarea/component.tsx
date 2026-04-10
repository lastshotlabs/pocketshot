import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput as RNTextInput, StyleSheet, Animated } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TextareaConfig } from './types'

const LINE_HEIGHT = 22

export function Textarea({ config }: { config: TextareaConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedError =
    config.errorText != null ? resolveFromRef(config.errorText, values) : undefined

  const [localValue, setLocalValue] = useState<string>(
    (resolvedValue as string | undefined) ?? config.defaultValue ?? '',
  )
  const [focused, setFocused] = useState(false)
  const [inputHeight, setInputHeight] = useState(config.minRows * LINE_HEIGHT)

  const focusAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as string)
    }
  }, [resolvedValue])

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start()
  }, [focused, focusAnim])

  const hasError = Boolean(resolvedError)

  const minHeight = config.minRows * LINE_HEIGHT
  const maxHeight = config.maxRows * LINE_HEIGHT

  const styles = useMemo(() => makeStyles(tokens, hasError), [tokens, hasError])

  const borderColor = useMemo(() => {
    if (hasError) return tokens.colors.error
    return focused ? tokens.colors.borderFocus : tokens.colors.inputBorder
  }, [hasError, focused, tokens])

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      setValue(config.id, text)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, setValue, dispatch],
  )

  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(
        Math.max(e.nativeEvent.contentSize.height, minHeight),
        maxHeight,
      )
      setInputHeight(newHeight)
    },
    [minHeight, maxHeight],
  )

  const charCount = localValue.length
  const atLimit = config.maxLength != null && charCount >= config.maxLength
  const showCount = config.showCharCount && config.maxLength != null

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
            styles.inputWrapper,
            {
              borderColor,
              borderWidth: focused ? 2 : 1,
            },
          ]}
        >
          <RNTextInput
            style={[styles.input, { height: Math.max(inputHeight, minHeight) }]}
            value={localValue}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onContentSizeChange={handleContentSizeChange}
            placeholder={config.placeholder}
            placeholderTextColor={tokens.colors.inputPlaceholder}
            multiline
            textAlignVertical="top"
            maxLength={config.maxLength}
            accessibilityLabel={config.label ?? config.placeholder ?? config.id}
            accessibilityRole="none"
            testID={config.testID ? `${config.testID}-input` : `${config.id}-input`}
            scrollEnabled={inputHeight >= maxHeight}
          />
        </Animated.View>
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {hasError && resolvedError ? (
              <Text
                style={styles.errorText}
                accessibilityRole="text"
                accessibilityLiveRegion="polite"
              >
                {resolvedError as string}
              </Text>
            ) : config.helperText != null ? (
              <Text style={styles.helperText} accessibilityRole="text">
                {config.helperText}
              </Text>
            ) : null}
          </View>
          {showCount && (
            <Text
              style={[styles.charCount, atLimit && styles.charCountAtLimit]}
              accessibilityRole="text"
              accessibilityLabel={`${charCount} of ${config.maxLength} characters`}
            >
              {charCount}/{config.maxLength}
            </Text>
          )}
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, _hasError: boolean) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    inputWrapper: {
      borderRadius: tokens.radius.md,
      overflow: 'hidden',
    },
    input: {
      backgroundColor: tokens.colors.inputBackground,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      lineHeight: LINE_HEIGHT,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginTop: tokens.spacing[1],
    },
    footerLeft: {
      flex: 1,
    },
    helperText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
    },
    charCount: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginLeft: tokens.spacing[2],
    },
    charCountAtLimit: {
      color: tokens.colors.error,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}
