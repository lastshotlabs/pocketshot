import React, { useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { NotificationItemConfig } from './types'

const SCREEN_WIDTH = Dimensions.get('window').width
const DISMISS_THRESHOLD = SCREEN_WIDTH * 0.4
// Sub-spacing gap between body text and adjacent elements; below the 4px grid
const BODY_MARGIN_TOP = 2

export function NotificationItem({ config }: { config: NotificationItemConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const title = resolveFromRef(config.title, values) as string
  const body =
    config.body != null ? (resolveFromRef(config.body, values) as string | undefined) : undefined
  const timestamp =
    config.timestamp != null
      ? (resolveFromRef(config.timestamp, values) as string | undefined)
      : undefined
  const read = config.read != null ? (resolveFromRef(config.read, values) as boolean) : false

  const translateX = useRef(new Animated.Value(0)).current
  const itemOpacity = useRef(new Animated.Value(1)).current

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20
      },
      onPanResponderMove: (_evt, gestureState) => {
        translateX.setValue(gestureState.dx)
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const shouldDismiss = Math.abs(gestureState.dx) > DISMISS_THRESHOLD

        if (shouldDismiss) {
          const direction = gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: direction,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(itemOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (config.onDismiss) {
              void dispatch(config.onDismiss)
            }
          })
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  const styles = makeStyles(tokens, read)

  const content = (
    <Animated.View
      style={[styles.container, { transform: [{ translateX }], opacity: itemOpacity }]}
      {...panResponder.panHandlers}
    >
      {/* Icon area */}
      <View style={styles.iconArea}>
        {config.icon != null ? (
          <Text style={styles.icon}>{config.icon}</Text>
        ) : (
          <View style={styles.iconDot} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {body != null && (
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        )}
        {timestamp != null && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>

      {/* Dismiss button */}
      {config.onDismiss != null && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => void dispatch(config.onDismiss!)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )

  if (config.onPress) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <TouchableOpacity
          onPress={() => void dispatch(config.onPress!)}
          accessibilityRole="button"
          accessibilityLabel={title}
          activeOpacity={0.7}
          testID={config.testID ?? config.id}
        >
          {content}
        </TouchableOpacity>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={config.testID ?? config.id}>{content}</View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, read: boolean) {
  const backgroundColor = read ? tokens.colors.surface : tokens.colors.surfaceAlt

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    iconArea: {
      width: tokens.spacing[10],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing[3],
    },
    icon: {
      fontSize: tokens.typography.fontSizeXl,
    },
    iconDot: {
      width: tokens.spacing[2],
      height: tokens.spacing[2],
      borderRadius: tokens.radius.sm,
      backgroundColor: read ? tokens.colors.textMuted : tokens.colors.primary,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: read ? tokens.typography.fontWeightRegular : tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    body: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginTop: BODY_MARGIN_TOP,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },
    dismissButton: {
      paddingLeft: tokens.spacing[3],
      alignItems: 'center',
      justifyContent: 'center',
    },
    dismissText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
  })
}

