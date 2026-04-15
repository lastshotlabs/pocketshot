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
import type { ReactionPickerConfig } from './types'

// ── Emoji button ──────────────────────────────────────────────────────────────

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

  const handlePress = useCallback(() => {
    onPress(emoji)
  }, [onPress, emoji])

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

// ── ReactionPicker ────────────────────────────────────────────────────────────

export function ReactionPicker({ config }: { config: ReactionPickerConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue } = useScreenContext()

  const [visible, setVisible] = useState(false)
  const popoverScale = useRef(new Animated.Value(0)).current
  const popoverOpacity = useRef(new Animated.Value(0)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Publish visibility to ScreenContext
  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, visible, setValue])

  const openPicker = useCallback(() => {
    setVisible(true)
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
  }, [popoverScale, popoverOpacity])

  const closePicker = useCallback(() => {
    Animated.parallel([
      Animated.timing(popoverScale, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(popoverOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false))
  }, [popoverScale, popoverOpacity])

  const handleSelect = useCallback(
    (emoji: string) => {
      setValue('__selectedReaction', { emoji })
      closePicker()
      void dispatch(config.onSelect)
    },
    [setValue, closePicker, dispatch, config.onSelect],
  )

  const triggerTestID = config.testID ? `${config.testID}-trigger` : `${config.id}-trigger`

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {/* Trigger */}
      <TouchableOpacity
        onPress={openPicker}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={config.triggerLabel ?? 'Add reaction'}
        accessibilityState={{ expanded: visible }}
        testID={triggerTestID}
        activeOpacity={0.75}
      >
        <Text style={styles.triggerIcon}>😊</Text>
        {config.triggerLabel != null && (
          <Text style={styles.triggerLabel}>{config.triggerLabel}</Text>
        )}
      </TouchableOpacity>

      {/* Popover modal */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closePicker}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback
          onPress={closePicker}
          accessibilityLabel="Close reaction picker"
        >
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.popoverPositioner}>
          <Animated.View
            style={[
              styles.popover,
              {
                transform: [{ scale: popoverScale }],
                opacity: popoverOpacity,
              },
            ]}
          >
            <View style={styles.emojiRow}>
              {config.reactions.map((emoji, idx) => (
                <EmojiButton
                  key={`${emoji}-${idx}`}
                  emoji={emoji}
                  onPress={handleSelect}
                  tokens={tokens}
                  testID={
                    config.testID
                      ? `${config.testID}-reaction-${idx}`
                      : `${config.id}-reaction-${idx}`
                  }
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    triggerIcon: {
      fontSize: tokens.typography.fontSizeMd,
    },
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
    popoverPositioner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    popover: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[2],
      ...tokens.shadows.xl,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    emojiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
    },
  })
}

