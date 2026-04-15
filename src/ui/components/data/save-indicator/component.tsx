import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { SaveIndicatorConfig } from './types'

type Status = 'idle' | 'saving' | 'saved' | 'error'

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      fontSize: tokens.typography.fontSizeSm,
      marginRight: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
    },
    savingDot: {
      width: 8,
      height: 8,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.textMuted,
      marginRight: tokens.spacing[2],
    },
  })
}

function SavingPulse({ tokens }: { tokens: DesignTokens }) {
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
      style={{
        width: 8,
        height: 8,
        borderRadius: tokens.radius.full,
        backgroundColor: tokens.colors.textMuted,
        marginRight: tokens.spacing[2],
        opacity,
      }}
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

  const styles = useMemo(() => makeStyles(tokens), [tokens])

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
    return <ComponentWrapper id={config.id} testID={config.testID} config={config}><View /></ComponentWrapper>
  }

  const savingLabel = config.savingLabel ?? 'Saving…'
  const savedLabel = config.savedLabel ?? 'Saved'
  const errorLabel = config.errorLabel ?? 'Error saving'

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Animated.View
        style={[styles.row, { opacity: fadeAnim }]}
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
            <Text style={[styles.label, { color: tokens.colors.textMuted }]}>{savingLabel}</Text>
          </>
        ) : displayStatus === 'saved' ? (
          <>
            <Text style={[styles.icon, { color: tokens.colors.success }]}>✓</Text>
            <Text style={[styles.label, { color: tokens.colors.success }]}>{savedLabel}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.icon, { color: tokens.colors.error }]}>✕</Text>
            <Text style={[styles.label, { color: tokens.colors.error }]}>{errorLabel}</Text>
          </>
        )}
      </Animated.View>
    </ComponentWrapper>
  )
}

