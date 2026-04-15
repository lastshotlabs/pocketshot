import React, { useMemo } from 'react'
import { View, Text, ActivityIndicator, Image, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ChatBubbleConfig } from './types'

const AVATAR_SIZE = 32
// Sub-spacing gap between message body and timestamp row; below the 4px grid
const FOOTER_MARGIN_TOP = 2

type ChatBubbleStyles = ReturnType<typeof makeStyles>

function StatusIndicator({
  status,
  color,
  styles,
}: {
  status: ChatBubbleConfig['status']
  color: string
  styles: Pick<ChatBubbleStyles, 'statusIcon' | 'statusText'>
}) {
  if (!status) return null
  if (status === 'sending') {
    return <ActivityIndicator size="small" color={color} style={styles.statusIcon} />
  }
  const label = status === 'read' ? '✓✓' : status === 'sent' ? '✓' : '⚠'
  return <Text style={[styles.statusText, { color }]}>{label}</Text>
}

function AvatarView({
  avatar,
  tokens,
  styles,
}: {
  avatar: ChatBubbleConfig['avatar']
  tokens: DesignTokens
  styles: Pick<ChatBubbleStyles, 'avatar' | 'avatarInitials' | 'avatarInitialsText' | 'avatarPlaceholder'>
}) {
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
  const timestamp =
    config.timestamp != null
      ? (resolveFromRef(config.timestamp, values) as string | undefined)
      : undefined
  const isOwn = config.isOwn != null ? (resolveFromRef(config.isOwn, values) as boolean) : false

  const styles = useMemo(() => makeStyles(tokens, isOwn), [tokens, isOwn])

  const bubbleContent = (
    <View style={styles.bubble}>
      <Text style={styles.messageText} accessibilityRole="text">
        {message}
      </Text>
      <View style={styles.footer}>
        {timestamp != null && <Text style={styles.timestamp}>{timestamp}</Text>}
        {isOwn && (
          <StatusIndicator status={config.status} color={tokens.colors.primaryForeground} styles={styles} />
        )}
      </View>
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={isOwn ? styles.rowOwn : styles.rowOther}>
        {!isOwn && <AvatarView avatar={config.avatar} tokens={tokens} styles={styles} />}
        {bubbleContent}
        {isOwn && <View style={styles.avatarPlaceholder} />}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, isOwn: boolean) {
  const backgroundColor = isOwn ? tokens.colors.primary : tokens.colors.surface
  const textColor = isOwn ? tokens.colors.primaryForeground : tokens.colors.text
  const timestampColor = isOwn ? tokens.colors.primaryForeground : tokens.colors.textMuted

  return StyleSheet.create({
    rowOwn: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      marginVertical: tokens.spacing[1],
      paddingHorizontal: tokens.spacing[3],
    },
    rowOther: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      marginVertical: tokens.spacing[1],
      paddingHorizontal: tokens.spacing[3],
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      marginRight: tokens.spacing[2],
    },
    avatarInitials: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing[2],
    },
    avatarInitialsText: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    avatarPlaceholder: {
      width: AVATAR_SIZE + tokens.spacing[2],
    },
    statusIcon: {
      marginLeft: tokens.spacing[1],
    },
    statusText: {
      fontSize: tokens.typography.fontSizeXs,
      marginLeft: tokens.spacing[1],
    },
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
      marginTop: FOOTER_MARGIN_TOP,
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: timestampColor,
    },
  })
}

