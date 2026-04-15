import React, { useEffect, useMemo, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TypingIndicatorConfig } from './types'

// ── Dot ───────────────────────────────────────────────────────────────────────

const DOT_SIZE = 8
const BOUNCE_HEIGHT = -6
const STAGGER_MS = 200
const BOUNCE_DURATION = 400

function BounceDot({
  delay,
  color,
  testID,
}: {
  delay: number
  color: string
  testID?: string
}) {
  const translateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: BOUNCE_HEIGHT,
          duration: BOUNCE_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: BOUNCE_DURATION / 2,
          useNativeDriver: true,
        }),
        // Pause so loop doesn't feel relentless
        Animated.delay(STAGGER_MS * 2),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [translateY, delay])

  return (
    <Animated.View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: color,
        transform: [{ translateY }],
      }}
      testID={testID}
    />
  )
}

// ── TypingIndicator ───────────────────────────────────────────────────────────

export function TypingIndicator({ config }: { config: TypingIndicatorConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const isTyping = resolveFromRef(config.isTyping, values) as boolean
  const userName =
    config.userName != null
      ? (resolveFromRef(config.userName, values) as string | undefined)
      : undefined

  const containerOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: isTyping ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isTyping, containerOpacity])

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Always render so the animation can fade out gracefully; wrapper handles error boundary
  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Animated.View
        style={[styles.wrapper, { opacity: containerOpacity }]}
        pointerEvents={isTyping ? 'auto' : 'none'}
        accessibilityLabel={userName ? `${userName} is typing` : 'Someone is typing'}
        accessibilityLiveRegion="polite"
        testID={config.testID}
      >
        <View style={styles.bubble}>
          <BounceDot delay={0} color={tokens.colors.textMuted} testID={config.testID ? `${config.testID}-dot-0` : undefined} />
          <BounceDot delay={STAGGER_MS} color={tokens.colors.textMuted} testID={config.testID ? `${config.testID}-dot-1` : undefined} />
          <BounceDot delay={STAGGER_MS * 2} color={tokens.colors.textMuted} testID={config.testID ? `${config.testID}-dot-2` : undefined} />
        </View>
        {userName != null && (
          <Text style={styles.label}>{userName} is typing</Text>
        )}
      </Animated.View>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[1],
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      alignSelf: 'flex-start',
    },
    label: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      paddingHorizontal: tokens.spacing[1],
    },
  })
}

