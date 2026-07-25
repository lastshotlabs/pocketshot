import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const AVATAR_SIZE = 28
const INDENT_WIDTH = 24

export interface CommentBaseAuthor {
  name: string
  avatar?: string
}

export interface CommentBase {
  id: string
  author: CommentBaseAuthor
  content: string
  timestamp: string
  likes: number
  liked?: boolean
  parentId?: string
  replies?: CommentBase[]
}

export interface CommentSectionBaseProps {
  /** Top-level comments (with optional nested replies). */
  comments: CommentBase[]
  /** Current user identifier (used to determine "own" comments). */
  currentUserId?: string
  /** Allow inline replies. */
  allowReplies?: boolean
  /** Maximum nesting depth for replies. */
  maxNestingLevel?: number
  /** Loading state. */
  loading?: boolean
  /** Called when the user submits a top-level or reply comment. */
  onSubmit?: (params: { parentId: string | null; content: string }) => void
  /** Called when a comment is liked/unliked. */
  onLike?: (comment: CommentBase) => void
  /** Called when a comment is deleted. */
  onDelete?: (comment: CommentBase) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD}d ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function flattenComments(
  comments: CommentBase[],
  maxDepth: number,
  depth = 0,
): Array<{ comment: CommentBase; depth: number }> {
  const result: Array<{ comment: CommentBase; depth: number }> = []
  for (const comment of comments) {
    result.push({ comment, depth: Math.min(depth, maxDepth) })
    if (comment.replies && comment.replies.length > 0 && depth < maxDepth) {
      result.push(...flattenComments(comment.replies, maxDepth, depth + 1))
    }
  }
  return result
}

function CommentAvatar({
  name,
  avatarUrl,
  tokens,
}: {
  name: string
  avatarUrl?: string
  tokens: DesignTokens
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
        resizeMode="cover"
        accessibilityLabel={name}
      />
    )
  }
  const initials = name ? name.slice(0, 1).toUpperCase() : '?'
  return (
    <View
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: tokens.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSizeXs,
          fontWeight: tokens.typography.fontWeightBold,
          color: tokens.colors.primaryForeground,
        }}
      >
        {initials}
      </Text>
    </View>
  )
}

function LikeButton({
  liked,
  count,
  onPress,
  tokens,
  testID,
}: {
  liked: boolean
  count: number
  onPress: () => void
  tokens: DesignTokens
  testID: string
}) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1.0, useNativeDriver: true, speed: 50, bounciness: 0 }),
    ]).start()
    onPress()
  }, [onPress, scale])

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] }}
        accessibilityRole="button"
        accessibilityLabel={
          liked ? `Unlike comment, ${count} likes` : `Like comment, ${count} likes`
        }
        accessibilityState={{ selected: liked }}
        testID={testID}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSizeSm,
            color: liked ? tokens.colors.error : tokens.colors.textMuted,
          }}
        >
          {liked ? '♥' : '♡'}
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSizeXs,
            color: liked ? tokens.colors.error : tokens.colors.textMuted,
            fontWeight: tokens.typography.fontWeightMedium,
          }}
        >
          {count}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function ReplyInput({
  onSubmit,
  onCancel,
  tokens,
  styles,
  testID,
}: {
  onSubmit: (text: string) => void
  onCancel: () => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  testID: string
}) {
  const [text, setText] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
  }, [text, onSubmit])

  const isEmpty = text.trim().length === 0

  return (
    <View style={styles.replyInputContainer}>
      <RNTextInput
        style={styles.replyTextInput}
        value={text}
        onChangeText={setText}
        placeholder="Write a reply..."
        placeholderTextColor={tokens.colors.inputPlaceholder}
        multiline
        maxLength={1000}
        accessibilityLabel="Reply input"
        testID={`${testID}-input`}
      />
      <View style={styles.replyActions}>
        <TouchableOpacity
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel reply"
          testID={`${testID}-cancel`}
        >
          <Text style={{ fontSize: tokens.typography.fontSizeSm, color: tokens.colors.textMuted }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isEmpty}
          accessibilityRole="button"
          accessibilityLabel="Submit reply"
          accessibilityState={{ disabled: isEmpty }}
          testID={`${testID}-submit`}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSizeSm,
              fontWeight: tokens.typography.fontWeightSemibold,
              color: isEmpty ? tokens.colors.textMuted : tokens.colors.primary,
            }}
          >
            Reply
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

interface CommentRowProps {
  comment: CommentBase
  depth: number
  currentUserId?: string
  allowReplies: boolean
  replyingToId: string | null
  onReply: (id: string) => void
  onCancelReply: () => void
  onSubmitReply: (parentId: string, text: string) => void
  onLike: (comment: CommentBase) => void
  onDelete: (comment: CommentBase) => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  testID?: string
}

function CommentRow({
  comment,
  depth,
  currentUserId,
  allowReplies,
  replyingToId,
  onReply,
  onCancelReply,
  onSubmitReply,
  onLike,
  onDelete,
  tokens,
  styles,
  testID,
}: CommentRowProps) {
  const isOwn = currentUserId != null && comment.author.name === currentUserId
  const commentTestID = testID ?? `comment-${comment.id}`
  const isReplying = replyingToId === comment.id

  const handleReply = useCallback(() => onReply(comment.id), [onReply, comment.id])
  const handleLike = useCallback(() => onLike(comment), [onLike, comment])
  const handleDelete = useCallback(() => onDelete(comment), [onDelete, comment])
  const handleSubmitReply = useCallback(
    (text: string) => onSubmitReply(comment.id, text),
    [onSubmitReply, comment.id],
  )

  return (
    <View style={[styles.commentRow, { marginLeft: depth * INDENT_WIDTH }]} testID={commentTestID}>
      <CommentAvatar name={comment.author.name} avatarUrl={comment.author.avatar} tokens={tokens} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{comment.author.name}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(comment.timestamp)}</Text>
        </View>

        <Text style={styles.commentBody}>{comment.content}</Text>

        <View style={styles.actionsRow}>
          <LikeButton
            liked={comment.liked ?? false}
            count={comment.likes}
            onPress={handleLike}
            tokens={tokens}
            testID={`${commentTestID}-like`}
          />

          {allowReplies && (
            <TouchableOpacity
              onPress={handleReply}
              accessibilityRole="button"
              accessibilityLabel="Reply to comment"
              testID={`${commentTestID}-reply`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSizeXs,
                  fontWeight: tokens.typography.fontWeightMedium,
                  color: tokens.colors.textMuted,
                }}
              >
                Reply
              </Text>
            </TouchableOpacity>
          )}

          {isOwn && (
            <TouchableOpacity
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete comment"
              testID={`${commentTestID}-delete`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSizeXs,
                  fontWeight: tokens.typography.fontWeightMedium,
                  color: tokens.colors.destructive,
                }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isReplying && (
          <ReplyInput
            onSubmit={handleSubmitReply}
            onCancel={onCancelReply}
            tokens={tokens}
            styles={styles}
            testID={`${commentTestID}-reply-input`}
          />
        )}
      </View>
    </View>
  )
}

/**
 * Standalone CommentSection — plain React props, no manifest required.
 *
 * @example
 * <CommentSectionBase comments={[]} onSubmit={({ content }) => post(content)} />
 */
export function CommentSectionBase({
  comments,
  currentUserId,
  allowReplies = true,
  maxNestingLevel = 3,
  loading,
  onSubmit,
  onLike,
  onDelete,
  style,
  testID,
  id,
}: CommentSectionBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [newCommentText, setNewCommentText] = useState('')

  const flatItems = useMemo(
    () => flattenComments(comments, maxNestingLevel),
    [comments, maxNestingLevel],
  )

  const handleReply = useCallback((replyId: string) => setReplyingToId(replyId), [])
  const handleCancelReply = useCallback(() => setReplyingToId(null), [])

  const handleSubmitReply = useCallback(
    (parentId: string, text: string) => {
      onSubmit?.({ parentId, content: text })
      setReplyingToId(null)
    },
    [onSubmit],
  )

  const handleLike = useCallback(
    (c: CommentBase) => {
      onLike?.(c)
    },
    [onLike],
  )

  const handleDelete = useCallback(
    (c: CommentBase) => {
      onDelete?.(c)
    },
    [onDelete],
  )

  const handleSubmitNewComment = useCallback(() => {
    const trimmed = newCommentText.trim()
    if (!trimmed) return
    onSubmit?.({ parentId: null, content: trimmed })
    setNewCommentText('')
  }, [newCommentText, onSubmit])

  const renderItem = useCallback(
    ({ item }: { item: { comment: CommentBase; depth: number } }) => (
      <CommentRow
        comment={item.comment}
        depth={item.depth}
        currentUserId={currentUserId}
        allowReplies={allowReplies}
        replyingToId={replyingToId}
        onReply={handleReply}
        onCancelReply={handleCancelReply}
        onSubmitReply={handleSubmitReply}
        onLike={handleLike}
        onDelete={handleDelete}
        tokens={tokens}
        styles={styles}
        testID={testID ? `${testID}-comment-${item.comment.id}` : undefined}
      />
    ),
    [
      currentUserId,
      allowReplies,
      replyingToId,
      handleReply,
      handleCancelReply,
      handleSubmitReply,
      handleLike,
      handleDelete,
      tokens,
      styles,
      testID,
    ],
  )

  const keyExtractor = useCallback(
    (item: { comment: CommentBase; depth: number }) => item.comment.id,
    [],
  )

  const isNewCommentEmpty = newCommentText.trim().length === 0

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]} testID={testID ?? id}>
        <ActivityIndicator color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, style]} testID={testID ?? id}>
      <FlatList
        data={flatItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        testID={testID ? `${testID}-list` : 'comment-section-list'}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet</Text>
          </View>
        }
      />

      <View style={styles.newCommentBar}>
        <RNTextInput
          style={styles.newCommentInput}
          value={newCommentText}
          onChangeText={setNewCommentText}
          placeholder="Add a comment..."
          placeholderTextColor={tokens.colors.inputPlaceholder}
          multiline
          maxLength={2000}
          accessibilityLabel="New comment input"
          testID={testID ? `${testID}-new-comment-input` : 'comment-section-input'}
        />
        <TouchableOpacity
          onPress={handleSubmitNewComment}
          disabled={isNewCommentEmpty}
          style={[styles.submitButton, isNewCommentEmpty && styles.submitButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          accessibilityState={{ disabled: isNewCommentEmpty }}
          testID={testID ? `${testID}-submit` : 'comment-section-submit'}
        >
          <Text style={styles.submitButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.colors.background },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[8],
    },
    listContent: { paddingVertical: tokens.spacing[2] },
    commentRow: {
      flexDirection: 'row',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    commentContent: { flex: 1 },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
    },
    authorName: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    commentBody: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
      marginTop: tokens.spacing[1],
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[3],
      marginTop: tokens.spacing[1],
    },
    replyInputContainer: {
      marginTop: tokens.spacing[2],
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.md,
      padding: tokens.spacing[2],
    },
    replyTextInput: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.inputText,
      minHeight: 32,
      maxHeight: 80,
      paddingVertical: 0,
    },
    replyActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: tokens.spacing[3],
      marginTop: tokens.spacing[1],
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[8],
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    newCommentBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: tokens.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.border,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    newCommentInput: {
      flex: 1,
      minHeight: 36,
      maxHeight: 80,
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.lg,
      paddingHorizontal: tokens.spacing[3],
      paddingTop: tokens.spacing[2],
      paddingBottom: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.inputText,
    },
    submitButton: {
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonDisabled: { opacity: 0.4 },
    submitButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
  })
}
