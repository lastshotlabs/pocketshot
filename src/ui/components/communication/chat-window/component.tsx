import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import { ChatWindowBase, type ChatWindowMessage } from './standalone'
import type { ChatWindowConfig, ChatMessage } from './types'
import { ChatWindowSchema } from './schema'

export function ChatWindow({ config: inputConfig }: { config: ChatWindowConfig }) {
  const config = ChatWindowSchema.parse(inputConfig)
  const { values, dispatch, setValue } = useScreenContext()

  const currentUserId = resolveFromRef(config.currentUserId, values) as string

  const { data, isLoading } = useComponentData<ChatMessage[]>(
    typeof config.data === 'string' ? config.data : config.data,
  )

  const messages = (data ?? []) as ChatWindowMessage[]

  const handleSend = useCallback(
    (text: string) => {
      setValue('__chatMessage', text)
      void dispatch(config.onSendAction)
    },
    [setValue, dispatch, config.onSendAction],
  )

  const handleAttach = useCallback(() => {
    if (config.onAttachAction) void dispatch(config.onAttachAction)
  }, [dispatch, config.onAttachAction])

  const handleTyping = useCallback(() => {
    if (config.onTypingAction) void dispatch(config.onTypingAction)
  }, [dispatch, config.onTypingAction])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>
      <ChatWindowBase
        id={config.id}
        testID={config.testID}
        messages={messages}
        currentUserId={currentUserId}
        showAvatars={config.showAvatars}
        loading={isLoading}
        placeholder={config.placeholder}
        maxLength={config.maxLength}
        onSend={handleSend}
        onAttach={config.onAttachAction ? handleAttach : undefined}
        onTyping={config.onTypingAction ? handleTyping : undefined}
      />
    </ComponentWrapper>
  )
}
