import React, { useCallback, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { ReactionBarBase, type ReactionItem } from './standalone'
import type { ReactionBarConfig } from './types'

export function ReactionBar({ config }: { config: ReactionBarConfig }) {
  const { values, dispatch, setValue } = useScreenContext()

  const rawReactions = resolveFromRef(config.reactions, values) as ReactionItem[]
  const [localReactions, setLocalReactions] = useState<ReactionItem[]>(() =>
    (rawReactions ?? []).map((r) => ({ ...r, reacted: r.reacted ?? false })),
  )

  const handleReact = useCallback(
    (reaction: ReactionItem) => {
      const updated = localReactions.map((r) => {
        if (r.emoji !== reaction.emoji) return r
        const nowReacted = !r.reacted
        return {
          ...r,
          reacted: nowReacted,
          count: nowReacted ? r.count + 1 : Math.max(0, r.count - 1),
        }
      })
      setLocalReactions(updated)
      const updatedReaction = updated.find((r) => r.emoji === reaction.emoji)!
      setValue('__reaction', updatedReaction)
      if (config.onReactAction) void dispatch(config.onReactAction)
    },
    [localReactions, setValue, dispatch, config.onReactAction],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ReactionBarBase
        id={config.id}
        testID={config.testID}
        reactions={localReactions}
        maxDisplay={config.maxDisplay}
        onReact={handleReact}
      />
    </ComponentWrapper>
  )
}
