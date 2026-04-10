import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { MessageThreadConfig, Message } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 32
const GROUP_GAP_MS = 2 * 60 * 1000 // 2 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  if (isToday) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  if (isYesterday) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

// ── Status indicator ──────────────────────────────────────────────────────────

function StatusText({
  status,
  color,
}: {
  status: Message['status']
  color: string
}) {
  if (!status) return null
  if (status === 'sending') return <ActivityIndicator size="small" color={color} />
  if (status === 'failed') return <Text style={{ fontSize: 12, color }}>⚠</Text>
  if (status === 'read') return <Text style={{ fontSize: 12, color }}>✓✓</Text>
  if (status === 'delivered') return <Text style={{ fontSize: 12, color }}>✓✓</Text>
  return <Text style={{ fontSize: 12, color }}>✓</Text>
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function AvatarOrPlaceholder({
  message,
  show,
  tokens,
}: {
  message: Message
  show: boolean
  tokens: DesignTokens
}) {
  const placeholderWidth = AVATAR_SIZE + tokens.spacing[2]

  if (!show) {
    return <View style={{ width: placeholderWidth }} />
  }

  if (message.senderAvatarUrl) {
    return (
      <Image
        source={{ uri: message.senderAvatarUrl }}
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          marginRight: tokens.spacing[2],
        }}
        resizeMode="cover"
        accessibilityLabel={message.senderName ?? 'Avatar'}
      />
    )
  }

  const initials = message.senderName ? message.senderName.slice(0, 2).toUpperCase() : '?'
  return (
    <View
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: tokens.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: tokens.spacing[2],
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSizeXs,
          fontWeight: tokens.typography.fontWeightSemibold,
          color: tokens.colors.text,
        }}
      >
        {initials}
      </Text>
    </View>
  )
}

// ── Mini reaction bar ─────────────────────────────────────────────────────────

function MiniReactions({
  reactions,
  tokens,
}: {
  reactions: NonNullable<Message['reactions']>
  tokens: DesignTokens
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {reactions.map((r) => (
        <View
          key={r.emoji}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: r.reacted ? tokens.colors.primary + '1a' : tokens.colors.surfaceAlt,
            borderColor: r.reacted ? tokens.colors.primary : tokens.colors.border,
            borderWidth: 1,
            borderRadius: tokens.radius.full,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text style={{ fontSize: tokens.typography.fontSizeXs }}>{r.emoji}</Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSizeXs,
              color: r.reacted ? tokens.colors.primary : tokens.colors.textMuted,
              marginLeft: 2,
            }}
          >
            {r.count}
          </Text>
        </View>
      ))}
    </View>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────

type FlatListItem =
  | { type: 'message'; message: Message; isOwn: boolean; isGroupFirst: boolean; showTimestamp: boolean }
  | { type: 'date-separator'; label: string; key: string }

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  isGroupFirst: boolean
  showAvatars: boolean
  showTimestamp: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onLongPress: (id: string) => void
  onReply: (message: Message) => void
}

function MessageBubble({
  message,
  isOwn,
  isGroupFirst,
  showAvatars,
  showTimestamp,
  tokens,
  styles,
  onLongPress,
  onReply,
}: MessageBubbleProps) {
  const bubbleStyle = [
    styles.bubble,
    isOwn ? styles.bubbleOwn : styles.bubbleOther,
    isOwn
      ? { borderBottomRightRadius: tokens.radius.sm }
      : { borderBottomLeftRadius: tokens.radius.sm },
  ]

  const statusColor = isOwn
    ? tokens.colors.primaryForeground
    : tokens.colors.textMuted

  return (
    <View style={isOwn ? styles.rowOwn : styles.rowOther}>
      {!isOwn && showAvatars && (
        <AvatarOrPlaceholder message={message} show={isGroupFirst} tokens={tokens} />
      )}

      <View style={styles.bubbleContainer}>
        {!isOwn && isGroupFirst && message.senderName != null && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        {message.replyTo != null && (
          <View style={isOwn ? styles.replyPreviewOwn : styles.replyPreviewOther}>
            {message.replyTo.senderName != null && (
              <Text style={styles.replyPreviewSender}>{message.replyTo.senderName}</Text>
            )}
            <Text style={styles.replyPreviewContent} numberOfLines={1}>
              {message.replyTo.content}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={bubbleStyle}
          onLongPress={() => onLongPress(message.id)}
          activeOpacity={0.85}
          accessibilityRole="text"
          accessibilityLabel={`Message from ${message.senderName ?? 'you'}: ${message.content}`}
          testID={`message-bubble-${message.id}`}
        >
          <Text style={isOwn ? styles.messageTextOwn : styles.messageTextOther}>
            {message.content}
          </Text>
        </TouchableOpacity>

        {message.reactions && message.reactions.length > 0 && (
          <MiniReactions reactions={message.reactions} tokens={tokens} />
        )}

        {showTimestamp && (
          <View style={isOwn ? styles.timestampRowOwn : styles.timestampRowOther}>
            <Text style={styles.timestamp}>{formatTime(message.createdAt)}</Text>
            {isOwn && (
              <StatusText
                status={message.status}
                color={message.status === 'read' ? tokens.colors.primary : tokens.colors.textMuted}
              />
            )}
            {isGroupFirst && !isOwn && (
              <TouchableOpacity
                onPress={() => onReply(message)}
                accessibilityRole="button"
                accessibilityLabel={`Reply to ${message.senderName ?? 'this message'}`}
                testID={`message-reply-${message.id}`}
                style={{ marginLeft: tokens.spacing[2] }}
              >
                <Text style={styles.replyButton}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {isOwn && showAvatars && <View style={{ width: AVATAR_SIZE + tokens.spacing[2] }} />}
    </View>
  )
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────

function MessageSkeleton({ tokens }: { tokens: DesignTokens }) {
  return (
    <View style={{ paddingHorizontal: tokens.spacing[3], paddingVertical: tokens.spacing[1] }}>
      {[0.7, 0.5, 0.8].map((w, i) => (
        <View
          key={i}
          style={{
            height: 40,
            width: `${w * 100}%`,
            backgroundColor: tokens.colors.surfaceAlt,
            borderRadius: tokens.radius.lg,
            marginBottom: tokens.spacing[2],
            alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
          }}
        />
      ))}
    </View>
  )
}

// ── MessageThread ─────────────────────────────────────────────────────────────

export function MessageThread({ config }: { config: MessageThreadConfig }) {
  const tokens = useTokens()
  const { values, dispatch, setValue } = useScreenContext()

  const currentUserId = resolveFromRef(config.currentUserId, values) as string

  const { data, isLoading, error } = useComponentData<Message[]>(
    typeof config.data === 'string' ? config.data : config.data,
  )

  const [pressedMessageId, setPressedMessageId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const messages: Message[] = data ?? []

  // Build flat list items with date separators
  const listItems = useMemo<FlatListItem[]>(() => {
    if (messages.length === 0) return []

    // Messages are newest first (inverted FlatList); process in display order (oldest first) then reverse
    const sorted = [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    const items: FlatListItem[] = []
    let prevDate: string | null = null
    let prevSenderId: string | null = null
    let prevTime: number | null = null

    for (const message of sorted) {
      // Date separator
      if (prevDate === null || !isSameDay(prevDate, message.createdAt)) {
        items.push({
          type: 'date-separator',
          label: formatDate(message.createdAt),
          key: `date-${message.createdAt}`,
        })
      }

      const msgTime = new Date(message.createdAt).getTime()
      const isGroupFirst =
        prevSenderId !== message.senderId ||
        prevTime === null ||
        msgTime - prevTime > GROUP_GAP_MS

      items.push({
        type: 'message',
        message,
        isOwn: message.senderId === currentUserId,
        isGroupFirst,
        showTimestamp: pressedMessageId === message.id,
      })

      prevDate = message.createdAt
      prevSenderId = message.senderId
      prevTime = msgTime
    }

    // Invert so FlatList (inverted) shows newest at bottom
    return items.reverse()
  }, [messages, currentUserId, pressedMessageId])

  const handleLongPress = useCallback((id: string) => {
    setPressedMessageId((prev) => (prev === id ? null : id))
  }, [])

  const handleReply = useCallback(
    (message: Message) => {
      setValue('__replyTo', message)
      if (config.onReplyAction) void dispatch(config.onReplyAction)
    },
    [setValue, dispatch, config.onReplyAction],
  )

  const handleEndReached = useCallback(() => {
    if (config.onLoadMoreAction) void dispatch(config.onLoadMoreAction)
  }, [dispatch, config.onLoadMoreAction])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    // Refresh is handled externally; just reset flag after a tick
    setTimeout(() => setRefreshing(false), 800)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: FlatListItem }) => {
      if (item.type === 'date-separator') {
        return (
          <View style={styles.dateSeparator}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorLabel}>{item.label}</Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )
      }

      return (
        <MessageBubble
          message={item.message}
          isOwn={item.isOwn}
          isGroupFirst={item.isGroupFirst}
          showAvatars={config.showAvatars}
          showTimestamp={item.showTimestamp}
          tokens={tokens}
          styles={styles}
          onLongPress={handleLongPress}
          onReply={handleReply}
        />
      )
    },
    [config.showAvatars, tokens, styles, handleLongPress, handleReply],
  )

  const keyExtractor = useCallback((item: FlatListItem, index: number) => {
    if (item.type === 'date-separator') return item.key
    return item.message.id
  }, [])

  if (isLoading) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <MessageSkeleton tokens={tokens} />
      </ComponentWrapper>
    )
  }

  if (error) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load messages</Text>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} style={{ flex: 1 }}>
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        testID={config.testID ? `${config.testID}-list` : undefined}
        refreshControl={
          config.refreshable ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
      />
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    list: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    listContent: {
      paddingVertical: tokens.spacing[2],
    },
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
    bubbleContainer: {
      maxWidth: '75%',
    },
    bubble: {
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
    },
    bubbleOwn: {
      backgroundColor: tokens.colors.primary,
      alignSelf: 'flex-end',
    },
    bubbleOther: {
      backgroundColor: tokens.colors.surfaceAlt,
      alignSelf: 'flex-start',
    },
    messageTextOwn: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primaryForeground,
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    messageTextOther: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    senderName: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginBottom: 2,
      marginLeft: tokens.spacing[1],
    },
    timestampRowOwn: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 2,
      gap: tokens.spacing[1],
    },
    timestampRowOther: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginTop: 2,
      gap: tokens.spacing[1],
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    replyButton: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    replyPreviewOwn: {
      backgroundColor: tokens.colors.primary + '33',
      borderLeftWidth: 2,
      borderLeftColor: tokens.colors.primaryForeground,
      borderRadius: tokens.radius.sm,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[1],
      marginBottom: 4,
    },
    replyPreviewOther: {
      backgroundColor: tokens.colors.border,
      borderLeftWidth: 2,
      borderLeftColor: tokens.colors.primary,
      borderRadius: tokens.radius.sm,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[1],
      marginBottom: 4,
    },
    replyPreviewSender: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
    },
    replyPreviewContent: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    dateSeparator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[3],
      marginVertical: tokens.spacing[3],
    },
    dateSeparatorLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
    },
    dateSeparatorLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginHorizontal: tokens.spacing[2],
      fontWeight: tokens.typography.fontWeightMedium,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.spacing[4],
    },
    errorText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.error,
    },
  })
}
