import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface ReactionPickerBaseProps {
  /** Visible state. */
  visible: boolean
  /** Called when picker requests close. */
  onClose: () => void
  /** Called when a reaction is selected. */
  onSelect: (emoji: string) => void
  /** Reaction emoji to render. */
  reactions: string[]
  /** Trigger label (when used with built-in trigger). */
  triggerLabel?: string
  /** Render the built-in trigger button. */
  showTrigger?: boolean
  /** Called when the built-in trigger is pressed. */
  onOpen?: () => void
  style?: ViewStyle
  testID?: string
  id?: string
}

function EmojiButton({
  emoji,
  onPress,
  tokens,
  testID,
}: {
  emoji: string
  onPress: (emoji: string) => void
  tokens: DesignTokens
  testID: string
}) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1.3,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start()
  }, [scale])

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1.0,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start()
  }, [scale])

  const handlePress = useCallback(() => onPress(emoji), [onPress, emoji])

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          paddingHorizontal: tokens.spacing[2],
          paddingVertical: tokens.spacing[1],
        }}
        accessibilityRole="button"
        accessibilityLabel={`React with ${emoji}`}
        testID={testID}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text style={{ fontSize: tokens.typography.fontSize2xl }}>{emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

/**
 * Standalone ReactionPicker — plain React props, no manifest required.
 *
 * @example
 * <ReactionPickerBase
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   onSelect={(e) => setReact(e)}
 *   reactions={['👍', '❤️', '😂']}
 * />
 */
export function ReactionPickerBase({
  visible,
  onClose,
  onSelect,
  reactions,
  triggerLabel,
  showTrigger = false,
  onOpen,
  style,
  testID,
  id,
}: ReactionPickerBaseProps) {
  const tokens = useTokens()
  const popoverScale = useRef(new Animated.Value(0)).current
  const popoverOpacity = useRef(new Animated.Value(0)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(popoverScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 16,
          bounciness: 10,
        }),
        Animated.timing(popoverOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(popoverScale, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(popoverOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, popoverScale, popoverOpacity])

  const triggerTestID = testID ? `${testID}-trigger` : id ? `${id}-trigger` : undefined

  return (
    <View style={style} testID={testID ?? id}>
      {showTrigger ? (
        <TouchableOpacity
          onPress={onOpen}
          style={styles.trigger}
          accessibilityRole="button"
          accessibilityLabel={triggerLabel ?? 'Add reaction'}
          accessibilityState={{ expanded: visible }}
          testID={triggerTestID}
          activeOpacity={0.75}
        >
          <Text style={styles.triggerIcon}>😊</Text>
          {triggerLabel != null && <Text style={styles.triggerLabel}>{triggerLabel}</Text>}
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close reaction picker"
        >
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.popoverPositioner}>
          <Animated.View
            style={[
              styles.popover,
              { transform: [{ scale: popoverScale }], opacity: popoverOpacity },
            ]}
          >
            <View style={styles.emojiRow}>
              {reactions.map((emoji, idx) => (
                <EmojiButton
                  key={`${emoji}-${idx}`}
                  emoji={emoji}
                  onPress={onSelect}
                  tokens={tokens}
                  testID={
                    testID
                      ? `${testID}-reaction-${idx}`
                      : id
                        ? `${id}-reaction-${idx}`
                        : `reaction-${idx}`
                  }
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

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
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[1],
    },
    triggerIcon: { fontSize: tokens.typography.fontSizeMd },
    triggerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'transparent',
    },
    popoverPositioner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    popover: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[2],
      ...tokens.shadows.xl,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    emojiRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] },
  })
}
