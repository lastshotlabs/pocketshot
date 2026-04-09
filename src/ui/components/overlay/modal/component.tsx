import React, { useEffect, useRef, type ReactNode } from 'react'
import {
  Animated,
  Dimensions,
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ModalConfig } from './types'

const WINDOW_WIDTH = Dimensions.get('window').width

const SIZE_MAP: Record<NonNullable<ModalConfig['size']>, number | 'full'> = {
  sm: 280,
  md: 360,
  lg: 480,
  full: 'full',
}

function makeStyles(tokens: DesignTokens, size: NonNullable<ModalConfig['size']>) {
  const width = SIZE_MAP[size]
  const contentWidth = width === 'full' ? WINDOW_WIDTH - tokens.spacing[8] : (width as number)

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentWrapper: {
      width: contentWidth,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      ...tokens.shadows.xl,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    title: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.full,
      marginLeft: tokens.spacing[2],
    },
    closeButtonText: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.textMuted,
      lineHeight: 22,
    },
    divider: {
      height: 1,
      backgroundColor: tokens.colors.divider,
      marginHorizontal: tokens.spacing[4],
    },
    body: {
      padding: tokens.spacing[4],
    },
  })
}

export interface ModalProps {
  config: ModalConfig
  children?: ReactNode
}

/**
 * Config-driven modal dialog. Open/close via ScreenContext key `__modal_{id}`.
 *
 * Uses React Native's built-in Modal with an animated fade-in/out.
 */
export function Modal({ config, children }: ModalProps) {
  const tokens = useTokens()
  const { getValue, setValue } = useScreenContext()

  const isOpen = Boolean(getValue(`__modal_${config.id}`))
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isOpen, opacity, scale])

  function handleClose() {
    setValue(`__modal_${config.id}`, false)
  }

  const styles = makeStyles(tokens, config.size)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback
          onPress={config.closeOnBackdrop ? handleClose : undefined}
          accessibilityLabel="Close modal"
        >
          <Animated.View style={[styles.backdrop, { opacity }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.contentWrapper, { transform: [{ scale }] }]}>
                {(config.title != null || config.showCloseButton) && (
                  <>
                    <View style={styles.header}>
                      {config.title != null ? (
                        <Text style={styles.title} accessibilityRole="header">
                          {config.title}
                        </Text>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                      {config.showCloseButton && (
                        <TouchableOpacity
                          onPress={handleClose}
                          style={styles.closeButton}
                          accessibilityLabel="Close"
                          accessibilityRole="button"
                          testID={config.testID ? `${config.testID}-close` : `${config.id}-close`}
                        >
                          <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.divider} />
                  </>
                )}
                <View style={styles.body}>{children}</View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    </ComponentWrapper>
  )
}
