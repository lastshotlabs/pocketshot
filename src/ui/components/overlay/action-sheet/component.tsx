import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ActionSheetConfig, ActionSheetPayload } from './types'

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.lg,
      borderTopRightRadius: tokens.radius.lg,
      paddingBottom: tokens.spacing[8],
      ...tokens.shadows.xl,
    },
    title: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    divider: {
      height: 1,
      backgroundColor: tokens.colors.divider,
      marginBottom: tokens.spacing[2],
    },
    option: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    optionText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      textAlign: 'center',
    },
    destructiveText: {
      color: tokens.colors.destructive,
    },
    cancelSeparator: {
      height: tokens.spacing[2],
      backgroundColor: tokens.colors.background,
    },
    cancelOption: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
    },
    cancelText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      textAlign: 'center',
    },
  })
}

/**
 * Config-driven action sheet. Place once at the root of each screen.
 *
 * Watches `__actionSheet` in ScreenContext (set by the `action-sheet` action).
 * Renders a bottom-anchored list of options in a modal sheet.
 */
export function ActionSheet({ config: _ }: { config: ActionSheetConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()

  const [activeSheet, setActiveSheet] = useState<ActionSheetPayload | null>(null)
  const translateY = useRef(new Animated.Value(300)).current
  const opacity = useRef(new Animated.Value(0)).current

  const sheetPayload = getValue('__actionSheet') as ActionSheetPayload | undefined

  useEffect(() => {
    if (!sheetPayload) return
    setActiveSheet(sheetPayload)

    translateY.setValue(300)
    opacity.setValue(0)

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [sheetPayload, translateY, opacity])

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setValue('__actionSheet', null)
      setActiveSheet(null)
    })
  }

  function handleOption(action: ActionSheetPayload['options'][number]['action']) {
    dismiss()
    // Brief delay so dismiss animation completes before any navigation
    setTimeout(() => {
      void dispatch(action)
    }, 260)
  }

  const styles = makeStyles(tokens)

  return (
    <Modal
      visible={activeSheet != null}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <TouchableWithoutFeedback onPress={dismiss} accessibilityLabel="Dismiss">
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
              {activeSheet?.title != null && (
                <>
                  <Text style={styles.title} accessibilityRole="header">
                    {activeSheet.title}
                  </Text>
                  <View style={styles.divider} />
                </>
              )}

              {activeSheet?.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.option}
                  onPress={() => handleOption(option.action)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  testID={`action-sheet-option-${index}`}
                >
                  <Text style={[styles.optionText, option.destructive && styles.destructiveText]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.cancelSeparator} />
              <TouchableOpacity
                style={styles.cancelOption}
                onPress={dismiss}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                testID="action-sheet-cancel"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
