import React from 'react'
import { View, Text, ActivityIndicator, Image, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ChatBubbleConfig } from './types'

function StatusIndicator({ status, color }: { status: ChatBubbleConfig['status']; color: string }) {
  if (!status) return null
  if (status === 'sending') {
    return <ActivityIndicator size="small" color={color} style={styles.statusIcon} />
  }
  const label = status === 'read' ? '✓✓' : status === 'sent' ? '✓' : '⚠'
  return (
    <Text style={[styles.statusText, { color }]}>
      {label}
    </Text>
  )
}

function AvatarView({ avatar, tokens }: { avatar: ChatBubbleConfig['avatar']; tokens: DesignTokens }) {
  if (!avatar) {
    return <View style={styles.avatarPlaceholder} />
  }

  if (avatar.src) {
    return (
      <Image
        source={{ uri: avatar.src }}
        style={styles.avatar}
        accessibilityLabel={avatar.name ?? 'Avatar'}
        resizeMode="cover"
      />
    )
  }

  // Initials fallback — rendered below in the bubble row
  const initials = avatar.name ? avatar.name.slice(0, 2).toUpperCase() : '?'
  return (
    <View style={[styles.avatarInitials, { backgroundColor: tokens.colors.surfaceAlt }]}>
      <Text style={[styles.avatarInitialsText, { color: tokens.colors.text }]}>{initials}</Text>
    </View>
  )
}

export function ChatBubble({ config }: { config: ChatBubbleConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const message = resolveFromRef(config.message, values) as string
  const timestamp = config.timestamp != null
    ? (resolveFromRef(config.timestamp, values) as string | undefined)
    : undefined
  const isOwn = config.isOwn != null
    ? (resolveFromRef(config.isOwn, values) as boolean)
    : false

  const dynamicStyles = makeDynamicStyles(tokens, isOwn)

  const bubbleContent = (
    <View style={dynamicStyles.bubble}>
      <Text style={dynamicStyles.messageText} accessibilityRole="text">
        {message}
      </Text>
      <View style={dynamicStyles.footer}>
        {timestamp != null && (
          <Text style={dynamicStyles.timestamp}>{timestamp}</Text>
        )}
        {isOwn && (
          <StatusIndicator
            status={config.status}
            color={tokens.colors.primaryForeground}
          />
        )}
      </View>
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={isOwn ? styles.rowOwn : styles.rowOther}>
        {!isOwn && <AvatarView avatar={config.avatar} tokens={tokens} />}
        {bubbleContent}
        {isOwn && <View style={styles.avatarPlaceholder} />}
      </View>
    </ComponentWrapper>
  )
}

const AVATAR_SIZE = 32

const styles = StyleSheet.create({
  rowOwn: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowOther: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 8,
  },
  avatarInitials: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarInitialsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE + 8,
  },
  statusIcon: {
    marginLeft: 4,
  },
  statusText: {
    fontSize: 11,
    marginLeft: 4,
  },
})

function makeDynamicStyles(tokens: DesignTokens, isOwn: boolean) {
  const backgroundColor = isOwn ? tokens.colors.primary : tokens.colors.surface
  const textColor = isOwn ? tokens.colors.primaryForeground : tokens.colors.text
  const timestampColor = isOwn
    ? tokens.colors.primaryForeground
    : tokens.colors.textMuted

  return StyleSheet.create({
    bubble: {
      backgroundColor,
      borderRadius: tokens.radius.lg,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      maxWidth: '75%',
    },
    messageText: {
      fontSize: tokens.typography.fontSizeMd,
      color: textColor,
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginTop: 2,
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: timestampColor,
    },
  })
}
