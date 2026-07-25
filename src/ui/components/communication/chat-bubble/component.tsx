import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { ChatBubbleBase, type ChatBubbleStatus, type ChatBubbleAvatar } from './standalone'
import type { ChatBubbleConfig } from './types'

export function ChatBubble({ config }: { config: ChatBubbleConfig }) {
  const { values } = useScreenContext()

  const message = resolveFromRef(config.message, values) as string
  const timestamp =
    config.timestamp != null
      ? (resolveFromRef(config.timestamp, values) as string | undefined)
      : undefined
  const isOwn = config.isOwn != null ? (resolveFromRef(config.isOwn, values) as boolean) : false

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ChatBubbleBase
        id={config.id}
        testID={config.testID}
        message={message}
        isOwn={isOwn}
        timestamp={timestamp}
        status={config.status as ChatBubbleStatus | undefined}
        avatar={config.avatar as ChatBubbleAvatar | undefined}
      />
    </ComponentWrapper>
  )
}
