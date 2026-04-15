import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { PopoverConfig } from './types'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: tokens.spacing[1],
    },
    triggerIcon: {
      fontSize: tokens.typography.fontSizeMd,
      marginRight: tokens.spacing[1],
    },
    triggerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
    },
    centeredContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panel: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[4],
      maxWidth: 300,
      width: '85%',
      ...tokens.shadows.xl,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: tokens.spacing[2],
    },
    panelTitle: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      flex: 1,
    },
    closeButton: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.full,
      marginLeft: tokens.spacing[2],
    },
    closeButtonText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      lineHeight: 20,
    },
    content: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
  })
}

// ---------------------------------------------------------------------------
// Popover
// ---------------------------------------------------------------------------

/**
 * A small floating content panel triggered by pressing a trigger element.
 * Opens a centered Modal with fade animation. Publishes visible state to
 * ScreenContext via config.id.
 */
export function Popover({ config }: { config: PopoverConfig }) {
  const tokens = useTokens()
  const { setValue } = useScreenContext()
  const [visible, setVisible] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const openPopover = useCallback(() => {
    setVisible(true)
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [opacity])

  const closePopover = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => setVisible(false))
  }, [opacity])

  // Publish visible state to ScreenContext whenever it changes
  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, visible, setValue])

  const handleBackdropPress = useCallback(() => {
    if (config.closeOnBackdrop ?? true) {
      closePopover()
    }
  }, [config.closeOnBackdrop, closePopover])

  const triggerTestID = config.testID ? `${config.testID}-trigger` : `${config.id}-trigger`
  const closeTestID = config.testID ? `${config.testID}-close` : `${config.id}-close`

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={visible ? ['open'] : undefined}
    >
      {/* Trigger button */}
      <TouchableOpacity
        onPress={openPopover}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityState={{ expanded: visible }}
        accessibilityLabel={`${config.triggerLabel} - press to open popover`}
        testID={triggerTestID}
        activeOpacity={0.75}
      >
        {config.triggerIcon != null && (
          <Text style={styles.triggerIcon} accessibilityElementsHidden>
            {config.triggerIcon}
          </Text>
        )}
        <Text style={styles.triggerLabel}>{config.triggerLabel}</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closePopover}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress} accessibilityLabel="Close popover">
          <Animated.View style={[styles.backdrop, { opacity }]}>
            <TouchableWithoutFeedback>
              <View style={styles.centeredContainer}>
                <View style={styles.panel}>
                  {/* Header row (title + close) */}
                  <View style={styles.panelHeader}>
                    {config.title != null ? (
                      <Text style={styles.panelTitle} accessibilityRole="header">
                        {config.title}
                      </Text>
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                    <TouchableOpacity
                      onPress={closePopover}
                      style={styles.closeButton}
                      accessibilityLabel="Close popover"
                      accessibilityRole="button"
                      testID={closeTestID}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Body content */}
                  <Text style={styles.content}>{config.content}</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </ComponentWrapper>
  )
}
