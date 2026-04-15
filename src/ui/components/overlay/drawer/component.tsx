import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { DrawerConfig } from './types'

const ANIMATION_DURATION = 280

function makeStyles(
  tokens: DesignTokens,
  position: NonNullable<DrawerConfig['position']>,
  widthPercent: number,
) {
  const screenWidth = Dimensions.get('window').width
  const drawerWidth = (screenWidth * widthPercent) / 100

  return StyleSheet.create({
    fill: {
      ...StyleSheet.absoluteFillObject,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tokens.colors.overlay,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      [position]: 0,
      width: drawerWidth,
      backgroundColor: tokens.colors.surface,
      ...tokens.shadows.xl,
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: tokens.spacing[3],
      paddingBottom: tokens.spacing[1],
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: tokens.colors.border,
      borderRadius: tokens.radius.full,
    },
    header: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    title: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    body: {
      flex: 1,
      padding: tokens.spacing[4],
    },
    bodyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    slot: {
      flex: 1,
    },
  })
}

/**
 * Config-driven side drawer. Open/close via ScreenContext key `__drawer_{id}`.
 *
 * Slides in from the configured side (left or right) with an animated
 * translateX transition and a fade-in backdrop.
 *
 * Handles Android hardware back button via Modal's `onRequestClose`.
 */
export function Drawer({ config }: { config: DrawerConfig }) {
  const tokens = useTokens()
  const { getValue, setValue } = useScreenContext()

  const position = config.position ?? 'left'
  const widthPercent = config.widthPercent ?? 80
  const showHandle = config.showHandle ?? true
  const closeOnBackdrop = config.closeOnBackdrop ?? true

  const screenWidth = Dimensions.get('window').width
  const drawerWidth = (screenWidth * widthPercent) / 100
  const hiddenX = position === 'left' ? -drawerWidth : drawerWidth

  const isOpen = Boolean(getValue(`__drawer_${config.id}`))

  // Once the drawer has been opened once, keep modal mounted so animations
  // remain smooth and state is preserved on close.
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (isOpen) setIsVisible(true)
  }, [isOpen])

  const translateX = useRef(new Animated.Value(hiddenX)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : hiddenX,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 0.5 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start()
  }, [isOpen, translateX, backdropOpacity, hiddenX])

  const handleClose = useCallback(() => {
    setValue(`__drawer_${config.id}`, false)
  }, [setValue, config.id])

  const styles = useMemo(
    () => makeStyles(tokens, position, widthPercent),
    [tokens, position, widthPercent],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Modal
        transparent
        animationType="none"
        visible={isVisible}
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <View style={styles.fill}>
          {/* Backdrop */}
          <TouchableWithoutFeedback
            onPress={closeOnBackdrop ? handleClose : undefined}
            accessibilityRole="none"
            accessibilityLabel="Close drawer"
          >
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>

          {/* Drawer panel */}
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX }] }]}
            testID={config.testID ? `${config.testID}-panel` : `drawer-${config.id}-panel`}
          >
            {showHandle && (
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            )}

            {config.title != null && (
              <View style={styles.header}>
                <Text
                  style={styles.title}
                  accessibilityRole="header"
                  testID={
                    config.testID
                      ? `${config.testID}-title`
                      : `drawer-${config.id}-title`
                  }
                >
                  {config.title}
                </Text>
              </View>
            )}

            {config.content != null ? (
              <View style={styles.body}>
                <Text style={styles.bodyText}>{config.content}</Text>
              </View>
            ) : (
              <View style={styles.slot} />
            )}
          </Animated.View>
        </View>
      </Modal>
    </ComponentWrapper>
  )
}

