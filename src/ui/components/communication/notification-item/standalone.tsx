import React, { useRef } from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const SCREEN_WIDTH = Dimensions.get('window').width
const DISMISS_THRESHOLD = SCREEN_WIDTH * 0.4
const BODY_MARGIN_TOP = 2

export interface NotificationItemBaseProps {
  /** Title text. */
  title: string
  /** Optional body text. */
  body?: string
  /** Optional timestamp string. */
  timestamp?: string
  /** Whether the notification has been read. */
  read?: boolean
  /** Optional emoji or short string icon. */
  icon?: string
  /** Called when item is pressed. */
  onPress?: () => void
  /** Called when item is dismissed (button or swipe). */
  onDismiss?: () => void
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone NotificationItem — plain React props, no manifest required.
 *
 * @example
 * <NotificationItemBase title="Welcome" body="Thanks for joining" onDismiss={() => ...} />
 */
export function NotificationItemBase({
  title,
  body,
  timestamp,
  read = false,
  icon,
  onPress,
  onDismiss,
  style,
  testID,
  id,
}: NotificationItemBaseProps) {
  const tokens = useTokens()
  const translateX = useRef(new Animated.Value(0)).current
  const itemOpacity = useRef(new Animated.Value(1)).current

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
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
            Animated.timing(itemOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            onDismiss?.()
          })
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
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
      <View style={styles.iconArea}>
        {icon != null ? <Text style={styles.icon}>{icon}</Text> : <View style={styles.iconDot} />}
      </View>

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

      {onDismiss != null && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        activeOpacity={0.7}
        testID={testID ?? id}
        style={style}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return (
    <View testID={testID ?? id} style={style}>
      {content}
    </View>
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
    icon: { fontSize: tokens.typography.fontSizeXl },
    iconDot: {
      width: tokens.spacing[2],
      height: tokens.spacing[2],
      borderRadius: tokens.radius.sm,
      backgroundColor: read ? tokens.colors.textMuted : tokens.colors.primary,
    },
    content: { flex: 1 },
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
