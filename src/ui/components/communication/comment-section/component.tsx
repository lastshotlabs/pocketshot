import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import { CommentSectionBase, type CommentBase } from './standalone'
import type { CommentSectionConfig, Comment } from './types'

export function CommentSection({ config }: { config: CommentSectionConfig }) {
  const { values, dispatch, setValue } = useScreenContext()

  const dataSpec = isFromRef(config.data) ? config.data : (config.data as string)
  const { data: rawData, isLoading } = useComponentData<Comment[]>(dataSpec)

  const resolvedData = useMemo<CommentBase[]>(() => {
    if (isFromRef(config.data)) {
      const ref = resolveFromRef(config.data, values)
      return Array.isArray(ref) ? (ref as CommentBase[]) : []
    }
    return Array.isArray(rawData) ? (rawData as CommentBase[]) : []
  }, [config.data, rawData, values])

  const handleSubmit = useCallback(
    ({ parentId, content }: { parentId: string | null; content: string }) => {
      setValue('__commentReply', { parentId, content })
      if (config.onSubmitComment) void dispatch(config.onSubmitComment)
    },
    [setValue, dispatch, config.onSubmitComment],
  )

  const handleLike = useCallback(
    (comment: CommentBase) => {
      setValue('__likedComment', { id: comment.id, liked: !comment.liked })
      if (config.onLikeComment) void dispatch(config.onLikeComment)
    },
    [setValue, dispatch, config.onLikeComment],
  )

  const handleDelete = useCallback(
    (comment: CommentBase) => {
      setValue('__deletedComment', { id: comment.id })
      if (config.onDeleteComment) void dispatch(config.onDeleteComment)
    },
    [setValue, dispatch, config.onDeleteComment],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>
      <CommentSectionBase
        id={config.id}
        testID={config.testID}
        comments={resolvedData}
        currentUserId={config.currentUserId}
        allowReplies={config.allowReplies}
        maxNestingLevel={config.maxNestingLevel}
        loading={isLoading}
        onSubmit={config.onSubmitComment ? handleSubmit : undefined}
        onLike={config.onLikeComment ? handleLike : undefined}
        onDelete={config.onDeleteComment ? handleDelete : undefined}
      />
    </ComponentWrapper>
  )
}
