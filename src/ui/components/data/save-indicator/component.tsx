import React, { useEffect, useRef, useState } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { SaveIndicatorConfig } from './types'

type Status = 'idle' | 'saving' | 'saved' | 'error'

function SavingPulse({
  tokens,
  style,
}: {
  tokens: DesignTokens
  style?: ViewStyle
}) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: tokens.radius.full,
          backgroundColor: tokens.colors.textMuted,
          marginRight: tokens.spacing[2],
          opacity,
        },
        style,
      ]}
    />
  )
}

export function SaveIndicator({ config }: { config: SaveIndicatorConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()
  const [displayStatus, setDisplayStatus] = useState<Status>('idle')
  const fadeAnim = useRef(new Animated.Value(0)).current
  const autoFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolvedStatus: Status = isFromRef(config.status)
    ? (String(resolveFromRef(config.status, values) ?? 'idle') as Status)
    : (config.status as Status) ?? 'idle'

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const iconSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })

  useEffect(() => {
    if (resolvedStatus === displayStatus) return

    if (autoFadeTimer.current) {
      clearTimeout(autoFadeTimer.current)
      autoFadeTimer.current = null
    }

    if (resolvedStatus === 'idle') {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setDisplayStatus('idle'))
      return
    }

    setDisplayStatus(resolvedStatus)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    if (resolvedStatus === 'saved') {
      autoFadeTimer.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setDisplayStatus('idle'))
      }, 2000)
    }
  }, [resolvedStatus, displayStatus, fadeAnim])

  useEffect(() => {
    return () => {
      if (autoFadeTimer.current) clearTimeout(autoFadeTimer.current)
    }
  }, [])

  if (displayStatus === 'idle') {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View />
      </ComponentWrapper>
    )
  }

  const savingLabel = config.savingLabel ?? 'Savingâ€¦'
  const savedLabel = config.savedLabel ?? 'Saved'
  const errorLabel = config.errorLabel ?? 'Error saving'

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  }
  const iconStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    marginRight: tokens.spacing[1],
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.textMuted,
  }
  const labelStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
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
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.textMuted,
  }
  const statusColor =
    displayStatus === 'saved'
      ? tokens.colors.success
      : displayStatus === 'error'
        ? tokens.colors.error
        : tokens.colors.textMuted

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Animated.View
        style={[rowStyle, { opacity: fadeAnim }]}
        accessibilityRole="text"
        accessibilityLabel={
          displayStatus === 'saving'
            ? savingLabel
            : displayStatus === 'saved'
              ? savedLabel
              : errorLabel
        }
      >
        {displayStatus === 'saving' ? (
          <>
            <SavingPulse tokens={tokens} />
            <Text
              style={[
                labelStyle,
                {
                  color:
                    typeof sharedTextStyle.color === 'string'
                      ? sharedTextStyle.color
                      : statusColor,
                },
                labelSurface.style as TextStyle | undefined,
              ]}
            >
              {savingLabel}
            </Text>
          </>
        ) : displayStatus === 'saved' ? (
          <>
            <Text
              style={[
                iconStyle,
                {
                  color:
                    typeof sharedTextStyle.color === 'string'
                      ? sharedTextStyle.color
                      : statusColor,
                },
                iconSurface.style as TextStyle | undefined,
              ]}
            >
              âœ“
            </Text>
            <Text
              style={[
                labelStyle,
                {
                  color:
                    typeof sharedTextStyle.color === 'string'
                      ? sharedTextStyle.color
                      : statusColor,
                },
                labelSurface.style as TextStyle | undefined,
              ]}
            >
              {savedLabel}
            </Text>
          </>
        ) : (
          <>
            <Text
              style={[
                iconStyle,
                {
                  color:
                    typeof sharedTextStyle.color === 'string'
                      ? sharedTextStyle.color
                      : statusColor,
                },
                iconSurface.style as TextStyle | undefined,
              ]}
            >
              âœ•
            </Text>
            <Text
              style={[
                labelStyle,
                {
                  color:
                    typeof sharedTextStyle.color === 'string'
                      ? sharedTextStyle.color
                      : statusColor,
                },
                labelSurface.style as TextStyle | undefined,
              ]}
            >
              {errorLabel}
            </Text>
          </>
        )}
      </Animated.View>
    </ComponentWrapper>
  )
}
