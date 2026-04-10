import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  TextInput as RNTextInput,
  Image,
  ActivityIndicator,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { CommentSectionConfig, Comment } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 28
const INDENT_WIDTH = 24

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/** Flatten nested comments into a flat list with depth info for FlatList rendering. */
function flattenComments(
  comments: Comment[],
  maxDepth: number,
  depth = 0,
): Array<{ comment: Comment; depth: number }> {
  const result: Array<{ comment: Comment; depth: number }> = []
  for (const comment of comments) {
    result.push({ comment, depth: Math.min(depth, maxDepth) })
    if (comment.replies && comment.replies.length > 0 && depth < maxDepth) {
      result.push(...flattenComments(comment.replies, maxDepth, depth + 1))
    }
  }
  return result
}

// ── Avatar ────────────────────────────────────────────────────────────────────

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
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
        }}
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

// ── Like button ───────────────────────────────────────────────────────────────

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
      Animated.spring(scale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1.0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
    ]).start()
    onPress()
  }, [onPress, scale])

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] }}
        accessibilityRole="button"
        accessibilityLabel={liked ? `Unlike comment, ${count} likes` : `Like comment, ${count} likes`}
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

// ── Reply input ───────────────────────────────────────────────────────────────

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

// ── Comment row ───────────────────────────────────────────────────────────────

interface CommentRowProps {
  comment: Comment
  depth: number
  currentUserId?: string
  allowReplies: boolean
  replyingToId: string | null
  onReply: (id: string) => void
  onCancelReply: () => void
  onSubmitReply: (parentId: string, text: string) => void
  onLike: (comment: Comment) => void
  onDelete: (comment: Comment) => void
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
    <View
      style={[styles.commentRow, { marginLeft: depth * INDENT_WIDTH }]}
      testID={commentTestID}
    >
      <CommentAvatar name={comment.author.name} avatarUrl={comment.author.avatar} tokens={tokens} />
      <View style={styles.commentContent}>
        {/* Header */}
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{comment.author.name}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(comment.timestamp)}</Text>
        </View>

        {/* Body */}
        <Text style={styles.commentBody}>{comment.content}</Text>

        {/* Actions row */}
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

        {/* Inline reply input */}
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

// ── CommentSection ────────────────────────────────────────────────────────────

export function CommentSection({ config }: { config: CommentSectionConfig }) {
  const tokens = useTokens()
  const { values, dispatch, setValue } = useScreenContext()

  const dataSpec = isFromRef(config.data) ? config.data : (config.data as string)
  const { data: rawData, isLoading } = useComponentData<Comment[]>(dataSpec)

  const resolvedData = useMemo<Comment[]>(() => {
    if (isFromRef(config.data)) {
      const ref = resolveFromRef(config.data, values)
      return Array.isArray(ref) ? (ref as Comment[]) : []
    }
    return Array.isArray(rawData) ? rawData : []
  }, [config.data, rawData, values])

  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [newCommentText, setNewCommentText] = useState('')

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const flatItems = useMemo(
    () => flattenComments(resolvedData, config.maxNestingLevel),
    [resolvedData, config.maxNestingLevel],
  )

  const handleReply = useCallback((id: string) => {
    setReplyingToId(id)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingToId(null)
  }, [])

  const handleSubmitReply = useCallback(
    (parentId: string, text: string) => {
      setValue('__commentReply', { parentId, content: text })
      setReplyingToId(null)
      if (config.onSubmitComment) void dispatch(config.onSubmitComment)
    },
    [setValue, dispatch, config.onSubmitComment],
  )

  const handleLike = useCallback(
    (comment: Comment) => {
      setValue('__likedComment', { id: comment.id, liked: !comment.liked })
      if (config.onLikeComment) void dispatch(config.onLikeComment)
    },
    [setValue, dispatch, config.onLikeComment],
  )

  const handleDelete = useCallback(
    (comment: Comment) => {
      setValue('__deletedComment', { id: comment.id })
      if (config.onDeleteComment) void dispatch(config.onDeleteComment)
    },
    [setValue, dispatch, config.onDeleteComment],
  )

  const handleSubmitNewComment = useCallback(() => {
    const trimmed = newCommentText.trim()
    if (!trimmed) return
    setValue('__commentReply', { parentId: null, content: trimmed })
    setNewCommentText('')
    if (config.onSubmitComment) void dispatch(config.onSubmitComment)
  }, [newCommentText, setValue, dispatch, config.onSubmitComment])

  const renderItem = useCallback(
    ({ item }: { item: { comment: Comment; depth: number } }) => (
      <CommentRow
        comment={item.comment}
        depth={item.depth}
        currentUserId={config.currentUserId}
        allowReplies={config.allowReplies}
        replyingToId={replyingToId}
        onReply={handleReply}
        onCancelReply={handleCancelReply}
        onSubmitReply={handleSubmitReply}
        onLike={handleLike}
        onDelete={handleDelete}
        tokens={tokens}
        styles={styles}
        testID={config.testID ? `${config.testID}-comment-${item.comment.id}` : undefined}
      />
    ),
    [
      config.currentUserId,
      config.allowReplies,
      config.testID,
      replyingToId,
      handleReply,
      handleCancelReply,
      handleSubmitReply,
      handleLike,
      handleDelete,
      tokens,
      styles,
    ],
  )

  const keyExtractor = useCallback(
    (item: { comment: Comment; depth: number }) => item.comment.id,
    [],
  )

  const isNewCommentEmpty = newCommentText.trim().length === 0

  if (isLoading) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.primary} />
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} style={{ flex: 1 }}>
      <View style={styles.container}>
        <FlatList
          data={flatItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          testID={config.testID ? `${config.testID}-list` : 'comment-section-list'}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No comments yet</Text>
            </View>
          }
        />

        {/* New comment input */}
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
            testID={config.testID ? `${config.testID}-new-comment-input` : 'comment-section-input'}
          />
          <TouchableOpacity
            onPress={handleSubmitNewComment}
            disabled={isNewCommentEmpty}
            style={[styles.submitButton, isNewCommentEmpty && styles.submitButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            accessibilityState={{ disabled: isNewCommentEmpty }}
            testID={config.testID ? `${config.testID}-submit` : 'comment-section-submit'}
          >
            <Text style={styles.submitButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[8],
    },
    listContent: {
      paddingVertical: tokens.spacing[2],
    },
    commentRow: {
      flexDirection: 'row',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    commentContent: {
      flex: 1,
    },
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
    // New comment bar
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
    submitButtonDisabled: {
      opacity: 0.4,
    },
    submitButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
  })
}
