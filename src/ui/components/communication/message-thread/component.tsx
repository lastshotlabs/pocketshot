import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import { MessageThreadBase, type MessageThreadMessage } from './standalone'
import type { MessageThreadConfig, Message } from './types'

export function MessageThread({ config }: { config: MessageThreadConfig }) {
  const { values, dispatch, setValue } = useScreenContext()

  const currentUserId = resolveFromRef(config.currentUserId, values) as string

  const { data, isLoading, error } = useComponentData<Message[]>(
    typeof config.data === 'string' ? config.data : config.data,
  )

  const messages = (data ?? []) as MessageThreadMessage[]

  const handleReply = useCallback(
    (message: MessageThreadMessage) => {
      setValue('__replyTo', message)
      if (config.onReplyAction) void dispatch(config.onReplyAction)
    },
    [setValue, dispatch, config.onReplyAction],
  )

  const handleLoadMore = useCallback(() => {
    if (config.onLoadMoreAction) void dispatch(config.onLoadMoreAction)
  }, [dispatch, config.onLoadMoreAction])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>
      <MessageThreadBase
        id={config.id}
        testID={config.testID}
        messages={messages}
        currentUserId={currentUserId}
        showAvatars={config.showAvatars}
        refreshable={config.refreshable}
        loading={isLoading}
        error={Boolean(error)}
        onLoadMore={config.onLoadMoreAction ? handleLoadMore : undefined}
        onReply={config.onReplyAction ? handleReply : undefined}
      />
    </ComponentWrapper>
  )
}
