import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const AVATAR_SIZE = 32
const GROUP_GAP_MS = 2 * 60 * 1000
const TYPING_DEBOUNCE_MS = 300

export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ChatWindowMessage {
  id: string
  content: string
  senderId: string
  senderName?: string
  senderAvatarUrl?: string
  createdAt: string
  reactions?: { emoji: string; count: number; reacted?: boolean }[]
  replyTo?: { id: string; content: string; senderName?: string }
  readBy?: string[]
  status?: ChatMessageStatus
}

export interface ChatWindowBaseProps {
  /** Messages to render. */
  messages: ChatWindowMessage[]
  /** Current user id used to determine bubble side. */
  currentUserId: string
  /** Show avatars next to messages. */
  showAvatars?: boolean
  /** Loading state. */
  loading?: boolean
  /** Input placeholder. */
  placeholder?: string
  /** Max input length. */
  maxLength?: number
  /** Called when the user sends a message. */
  onSend: (text: string) => void
  /** Called when the user taps the attach button. If undefined, button is hidden. */
  onAttach?: () => void
  /** Called as the user types (debounced). */
  onTyping?: (text: string) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

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

function StatusText({ status, color }: { status: ChatMessageStatus | undefined; color: string }) {
  if (!status) return null
  if (status === 'sending') return <ActivityIndicator size="small" color={color} />
  if (status === 'failed') return <Text style={{ fontSize: 12, color }}>⚠</Text>
  if (status === 'read') return <Text style={{ fontSize: 12, color }}>✓✓</Text>
  if (status === 'delivered') return <Text style={{ fontSize: 12, color }}>✓✓</Text>
  return <Text style={{ fontSize: 12, color }}>✓</Text>
}

function AvatarView({
  message,
  show,
  tokens,
}: {
  message: ChatWindowMessage
  show: boolean
  tokens: DesignTokens
}) {
  const placeholderWidth = AVATAR_SIZE + tokens.spacing[2]
  if (!show) return <View style={{ width: placeholderWidth }} />
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

type FlatListItem =
  | {
      type: 'message'
      message: ChatWindowMessage
      isOwn: boolean
      isGroupFirst: boolean
      showTimestamp: boolean
    }
  | { type: 'date-separator'; label: string; key: string }

interface BubbleProps {
  item: Extract<FlatListItem, { type: 'message' }>
  showAvatars: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onLongPress: (id: string) => void
}

function Bubble({ item, showAvatars, tokens, styles, onLongPress }: BubbleProps) {
  const { message, isOwn, isGroupFirst, showTimestamp } = item

  const bubbleStyle = [
    styles.bubble,
    isOwn ? styles.bubbleOwn : styles.bubbleOther,
    isOwn
      ? { borderBottomRightRadius: tokens.radius.sm }
      : { borderBottomLeftRadius: tokens.radius.sm },
  ]

  return (
    <View style={isOwn ? styles.rowOwn : styles.rowOther}>
      {!isOwn && showAvatars && (
        <AvatarView message={message} show={isGroupFirst} tokens={tokens} />
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
          testID={`chat-message-${message.id}`}
        >
          <Text style={isOwn ? styles.textOwn : styles.textOther}>{message.content}</Text>
        </TouchableOpacity>

        {message.reactions && message.reactions.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {message.reactions.map((r) => (
              <View
                key={r.emoji}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: r.reacted
                    ? tokens.colors.primary + '1a'
                    : tokens.colors.surfaceAlt,
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
          </View>
        )}
      </View>

      {isOwn && showAvatars && <View style={{ width: AVATAR_SIZE + tokens.spacing[2] }} />}
    </View>
  )
}

interface InputBarProps {
  placeholder: string
  maxLength: number
  onSend: (text: string) => void
  onAttach?: () => void
  onTyping?: (text: string) => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  testID?: string
}

function InputBar({
  placeholder,
  maxLength,
  onSend,
  onAttach,
  onTyping,
  tokens,
  styles,
  testID,
}: InputBarProps) {
  const [text, setText] = useState('')
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value)
      if (onTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => onTyping(value), TYPING_DEBOUNCE_MS)
      }
    },
    [onTyping],
  )

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
  }, [text, onSend])

  const isEmpty = text.trim().length === 0

  return (
    <View style={styles.inputBar}>
      {onAttach != null && (
        <TouchableOpacity
          style={styles.attachButton}
          onPress={onAttach}
          accessibilityRole="button"
          accessibilityLabel="Attach file"
          testID={testID ? `${testID}-attach` : 'chat-attach'}
        >
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>
      )}

      <RNTextInput
        style={styles.textInput}
        value={text}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        multiline
        maxLength={maxLength}
        accessibilityLabel="Message input"
        testID={testID ? `${testID}-input` : 'chat-input'}
        returnKeyType="default"
        blurOnSubmit={false}
      />

      <TouchableOpacity
        style={[styles.sendButton, isEmpty && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={isEmpty}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: isEmpty }}
        testID={testID ? `${testID}-send` : 'chat-send'}
      >
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  )
}

/**
 * Standalone ChatWindow — plain React props, no manifest required.
 *
 * @example
 * <ChatWindowBase
 *   currentUserId="u1"
 *   messages={[]}
 *   onSend={(text) => console.log(text)}
 * />
 */
export function ChatWindowBase({
  messages,
  currentUserId,
  showAvatars = true,
  loading,
  placeholder = 'Type a message...',
  maxLength = 2000,
  onSend,
  onAttach,
  onTyping,
  style,
  testID,
  id,
}: ChatWindowBaseProps) {
  const tokens = useTokens()
  const [pressedMessageId, setPressedMessageId] = useState<string | null>(null)
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const listItems = useMemo<FlatListItem[]>(() => {
    if (messages.length === 0) return []

    const sorted = [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    const items: FlatListItem[] = []
    let prevDate: string | null = null
    let prevSenderId: string | null = null
    let prevTime: number | null = null

    for (const message of sorted) {
      if (prevDate === null || !isSameDay(prevDate, message.createdAt)) {
        items.push({
          type: 'date-separator',
          label: formatDate(message.createdAt),
          key: `date-${message.createdAt}`,
        })
      }

      const msgTime = new Date(message.createdAt).getTime()
      const isGroupFirst =
        prevSenderId !== message.senderId || prevTime === null || msgTime - prevTime > GROUP_GAP_MS

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

    return items.reverse()
  }, [messages, currentUserId, pressedMessageId])

  const handleLongPress = useCallback((mid: string) => {
    setPressedMessageId((prev) => (prev === mid ? null : mid))
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
        <Bubble
          item={item}
          showAvatars={showAvatars}
          tokens={tokens}
          styles={styles}
          onLongPress={handleLongPress}
        />
      )
    },
    [showAvatars, tokens, styles, handleLongPress],
  )

  const keyExtractor = useCallback((item: FlatListItem) => {
    if (item.type === 'date-separator') return item.key
    return item.message.id
  }, [])

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      testID={testID ?? id}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          testID={testID ? `${testID}-messages` : 'chat-messages'}
        />
      )}

      <InputBar
        placeholder={placeholder}
        maxLength={maxLength}
        onSend={onSend}
        onAttach={onAttach}
        onTyping={onTyping}
        tokens={tokens}
        styles={styles}
        testID={testID}
      />
    </KeyboardAvoidingView>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.colors.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { flex: 1 },
    listContent: { paddingVertical: tokens.spacing[2] },
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
    bubbleContainer: { maxWidth: '75%' },
    bubble: {
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
    },
    bubbleOwn: { backgroundColor: tokens.colors.primary, alignSelf: 'flex-end' },
    bubbleOther: { backgroundColor: tokens.colors.surfaceAlt, alignSelf: 'flex-start' },
    textOwn: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primaryForeground,
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    textOther: {
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
    timestamp: { fontSize: tokens.typography.fontSizeXs, color: tokens.colors.textMuted },
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
    replyPreviewContent: { fontSize: tokens.typography.fontSizeXs, color: tokens.colors.textMuted },
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
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: tokens.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.border,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    attachButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachIcon: { fontSize: tokens.typography.fontSizeLg },
    textInput: {
      flex: 1,
      minHeight: 36,
      maxHeight: 100,
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[3],
      paddingTop: tokens.spacing[2],
      paddingBottom: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: { opacity: 0.4 },
    sendIcon: { fontSize: tokens.typography.fontSizeMd, color: tokens.colors.primaryForeground },
  })
}
