import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Modal as RNModal,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ConfirmDialogConfig } from './types'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panel: {
      width: 300,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      ...tokens.shadows.xl,
      overflow: 'hidden',
    },
    body: {
      padding: tokens.spacing[5],
    },
    title: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[2],
    },
    message: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    buttonRow: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.divider,
    },
    cancelButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[3],
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: tokens.colors.divider,
    },
    cancelText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.textMuted,
    },
    confirmButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[3],
    },
    confirmTextDefault: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
    },
    confirmTextDestructive: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.destructive,
    },
  })
}

// ---------------------------------------------------------------------------
// ConfirmDialog
// ---------------------------------------------------------------------------

/**
 * Confirmation modal dialog. Opens via setValue('__confirm_<id>', true) in
 * ScreenContext. Renders a centered card with title, message, and two buttons.
 * Destructive variant highlights the confirm button in red.
 */
export function ConfirmDialog({ config }: { config: ConfirmDialogConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()

  const isOpen = Boolean(getValue(`__confirm_${config.id}`))
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [isOpen, opacity, scale])

  const handleClose = useCallback(() => {
    setValue(`__confirm_${config.id}`, false)
  }, [config.id, setValue])

  const handleCancel = useCallback(async () => {
    handleClose()
    if (config.onCancel) {
      await dispatch(config.onCancel)
    }
  }, [handleClose, config.onCancel, dispatch])

  const handleConfirm = useCallback(async () => {
    handleClose()
    await dispatch(config.onConfirm)
  }, [handleClose, config.onConfirm, dispatch])

  const variant = config.variant ?? 'default'
  const confirmLabel = config.confirmLabel ?? 'Confirm'
  const cancelLabel = config.cancelLabel ?? 'Cancel'
  const baseTestID = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleCancel}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleCancel} accessibilityLabel="Dismiss">
          <Animated.View style={[styles.backdrop, { opacity }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.panel, { transform: [{ scale }] }]}>
                <View style={styles.body}>
                  <Text
                    style={styles.title}
                    accessibilityRole="header"
                    testID={`${baseTestID}-title`}
                  >
                    {config.title}
                  </Text>
                  <Text style={styles.message} testID={`${baseTestID}-message`}>
                    {config.message}
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={styles.cancelButton}
                    accessibilityRole="button"
                    accessibilityLabel={cancelLabel}
                    testID={`${baseTestID}-cancel`}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>{cancelLabel}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirm}
                    style={styles.confirmButton}
                    accessibilityRole="button"
                    accessibilityLabel={confirmLabel}
                    testID={`${baseTestID}-confirm`}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={
                        variant === 'destructive'
                          ? styles.confirmTextDestructive
                          : styles.confirmTextDefault
                      }
                    >
                      {confirmLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    </ComponentWrapper>
  )
}

