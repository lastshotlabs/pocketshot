import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { Avatar } from '../avatar/component'
import type { DesignTokens } from '../../../tokens/types'
import type { AvatarGroupConfig, AvatarGroupItem } from './types'

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56 } as const

export function AvatarGroup({ config }: { config: AvatarGroupConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()

  const resolvedAvatars: AvatarGroupItem[] = isFromRef(config.avatars)
    ? (((resolveFromRef(config.avatars as { from: string }, values) as unknown) as AvatarGroupItem[]) ?? [])
    : (config.avatars as unknown as AvatarGroupItem[])

  const size = config.size
  const pixelSize = SIZE_MAP[size]
  const overlap = config.overlap
  const visible = resolvedAvatars.slice(0, config.maxVisible)
  const overflowCount = Math.max(0, resolvedAvatars.length - config.maxVisible)

  const styles = makeStyles(tokens, pixelSize, overlap)

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const groupLabel = `${resolvedAvatars.length} members`

  const inner = (
    <View
      style={[styles.row, { width: pixelSize + (visible.length - 1 + (overflowCount > 0 ? 1 : 0)) * (pixelSize - overlap) }]}
      accessibilityLabel={groupLabel}
    >
      {visible.map((item, index) => (
        <View key={index} style={[styles.avatarWrapper, { left: index * (pixelSize - overlap) }]}>
          <Avatar
            config={{
              src: item.src,
              name: item.name,
              size,
              shape: 'circle',
            }}
          />
        </View>
      ))}
      {overflowCount > 0 ? (
        <View
          style={[
            styles.overflowBadge,
            { left: visible.length * (pixelSize - overlap) },
          ]}
        >
          <Text style={styles.overflowText}>+{overflowCount}</Text>
        </View>
      ) : null}
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {config.onPress ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={groupLabel}
          accessibilityHint="Tap to view all members"
        >
          {inner}
        </TouchableOpacity>
      ) : (
        inner
      )}
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, pixelSize: number, overlap: number) {
  const fontSize = Math.round(pixelSize * 0.32)
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      height: pixelSize,
      position: 'relative',
    },
    avatarWrapper: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: tokens.colors.background,
      borderRadius: pixelSize / 2,
    },
    overflowBadge: {
      position: 'absolute',
      width: pixelSize,
      height: pixelSize,
      borderRadius: pixelSize / 2,
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 2,
      borderColor: tokens.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overflowText: {
      fontSize,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
  })
}
