import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TypingIndicatorConfig } from './types'

const DOT_SIZE = 8
const BOUNCE_HEIGHT = -6
const STAGGER_MS = 200
const BOUNCE_DURATION = 400

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

export function TypingIndicator({ config }: { config: TypingIndicatorConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const isTyping = resolveFromRef(config.isTyping, values) as boolean
  const userName =
    config.userName != null
      ? (resolveFromRef(config.userName, values) as string | undefined)
      : undefined

  const containerOpacity = useRef(new Animated.Value(0)).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const rootSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const dotsSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.dots as Record<string, unknown> | undefined,
  })
  const dotSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.dot as Record<string, unknown> | undefined,
  })
  const textSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.text as Record<string, unknown> | undefined,
  })

  useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: isTyping ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isTyping, containerOpacity])

  const styles = useMemo(() => makeStyles(tokens, sharedTextStyle), [tokens, sharedTextStyle])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Animated.View
        style={[styles.wrapper, rootSurface.style as ViewStyle | undefined, { opacity: containerOpacity }]}
        pointerEvents={isTyping ? 'auto' : 'none'}
        accessibilityLabel={userName ? `${userName} is typing` : 'Someone is typing'}
        accessibilityLiveRegion="polite"
        testID={config.testID}
      >
        <View style={[styles.bubble, dotsSurface.style as ViewStyle | undefined]}>
          <BounceDot
            delay={0}
            color={tokens.colors.textMuted}
            style={dotSurface.style as ViewStyle | undefined}
            testID={config.testID ? `${config.testID}-dot-0` : undefined}
          />
          <BounceDot
            delay={STAGGER_MS}
            color={tokens.colors.textMuted}
            style={dotSurface.style as ViewStyle | undefined}
            testID={config.testID ? `${config.testID}-dot-1` : undefined}
          />
          <BounceDot
            delay={STAGGER_MS * 2}
            color={tokens.colors.textMuted}
            style={dotSurface.style as ViewStyle | undefined}
            testID={config.testID ? `${config.testID}-dot-2` : undefined}
          />
        </View>
        {userName != null ? (
          <Text style={[styles.label, textSurface.style as TextStyle | undefined]}>
            {userName} is typing
          </Text>
        ) : null}
      </Animated.View>
    </ComponentWrapper>
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
        typeof sharedTextStyle.color === 'string'
          ? sharedTextStyle.color
          : tokens.colors.textMuted,
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
