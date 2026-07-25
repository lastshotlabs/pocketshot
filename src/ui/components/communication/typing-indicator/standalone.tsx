import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const DOT_SIZE = 8
const BOUNCE_HEIGHT = -6
const STAGGER_MS = 200
const BOUNCE_DURATION = 400

export interface TypingIndicatorBaseProps {
  /** Whether someone is typing. */
  isTyping: boolean
  /** Optional user name. If provided, shown as "{name} is typing". */
  userName?: string
  /** Slot overrides (root, dots, dot, text). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function BounceDot({
  delay,
  color,
  style,
  testID,
}: {
  delay: number
  color: string
  style?: ViewStyle
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
        Animated.delay(STAGGER_MS * 2),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [translateY, delay])

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: color,
          transform: [{ translateY }],
        },
        style,
      ]}
      testID={testID}
    />
  )
}

/**
 * Standalone TypingIndicator — plain React props, no manifest required.
 *
 * @example
 * <TypingIndicatorBase isTyping userName="Ada" />
 */
export function TypingIndicatorBase({
  isTyping,
  userName,
  slots,
  style,
  testID,
  id,
}: TypingIndicatorBaseProps) {
  const tokens = useTokens()
  const containerOpacity = useRef(new Animated.Value(0)).current
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const dotsSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.dots })
  const dotSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.dot })
  const textSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.text })

  useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: isTyping ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isTyping, containerOpacity])

  const styles = useMemo(() => makeStyles(tokens, sharedTextStyle), [tokens, sharedTextStyle])

  return (
    <Animated.View
      style={[
        styles.wrapper,
        rootSurface.style as ViewStyle | undefined,
        { opacity: containerOpacity },
        style,
      ]}
      pointerEvents={isTyping ? 'auto' : 'none'}
      accessibilityLabel={userName ? `${userName} is typing` : 'Someone is typing'}
      accessibilityLiveRegion="polite"
      testID={testID ?? id}
    >
      <View style={[styles.bubble, dotsSurface.style as ViewStyle | undefined]}>
        <BounceDot
          delay={0}
          color={tokens.colors.textMuted}
          style={dotSurface.style as ViewStyle | undefined}
          testID={testID ? `${testID}-dot-0` : undefined}
        />
        <BounceDot
          delay={STAGGER_MS}
          color={tokens.colors.textMuted}
          style={dotSurface.style as ViewStyle | undefined}
          testID={testID ? `${testID}-dot-1` : undefined}
        />
        <BounceDot
          delay={STAGGER_MS * 2}
          color={tokens.colors.textMuted}
          style={dotSurface.style as ViewStyle | undefined}
          testID={testID ? `${testID}-dot-2` : undefined}
        />
      </View>
      {userName != null ? (
        <Text style={[styles.label, textSurface.style as TextStyle | undefined]}>
          {userName} is typing
        </Text>
      ) : null}
    </Animated.View>
  )
}

function makeStyles(
  tokens: DesignTokens,
  sharedTextStyle: ReturnType<typeof resolveNativeTextStyle>,
) {
  return {
    wrapper: {
      alignSelf: 'flex-start',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[1],
    } satisfies ViewStyle,
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      alignSelf: 'flex-start',
    } satisfies ViewStyle,
    label: {
      fontSize:
        typeof sharedTextStyle.fontSize === 'number'
          ? sharedTextStyle.fontSize
          : tokens.typography.fontSizeXs,
      color:
        typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.textMuted,
      fontWeight:
        typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
      lineHeight:
        typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
      letterSpacing:
        typeof sharedTextStyle.letterSpacing === 'number'
          ? sharedTextStyle.letterSpacing
          : undefined,
      textAlign:
        typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
      marginTop: tokens.spacing[1],
      paddingHorizontal: tokens.spacing[1],
    } satisfies TextStyle,
  }
}
