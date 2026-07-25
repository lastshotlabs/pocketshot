import { useCallback, useEffect, useState } from 'react'
import type { AiConversationController } from './controller'
import type { AiConversation } from './types'

/** React binding for a durable streaming conversation controller. */
export function useStreamingConversation(
  controller: AiConversationController,
  conversationId: string,
) {
  const [conversation, setConversation] = useState<AiConversation | null>(() =>
    controller.get(conversationId),
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(
    () =>
      controller.subscribe((next) => {
        if (next.id === conversationId) setConversation(next)
      }),
    [controller, conversationId],
  )

  useEffect(() => {
    void controller.load().then(() => setConversation(controller.get(conversationId)))
  }, [controller, conversationId])

  const run = useCallback(async (operation: () => Promise<AiConversation>) => {
    setIsStreaming(true)
    setError(null)
    try {
      const result = await operation()
      setConversation(result)
      return result
    } catch (reason) {
      const next = reason instanceof Error ? reason : new Error(String(reason))
      setError(next)
      throw next
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const send = useCallback(
    (message: string, idempotencyKey?: string) =>
      run(() => controller.send(conversationId, message, idempotencyKey)),
    [controller, conversationId, run],
  )
  const retry = useCallback(
    () => run(() => controller.retry(conversationId)),
    [controller, conversationId, run],
  )
  const resume = useCallback(
    () => run(() => controller.resume(conversationId)),
    [controller, conversationId, run],
  )
  const stop = useCallback(() => controller.stop(conversationId), [controller, conversationId])

  return {
    conversation,
    isStreaming,
    error,
    send,
    stop,
    retry,
    resume,
    confirmAction: controller.confirmAction.bind(controller, conversationId),
    rejectAction: controller.rejectAction.bind(controller, conversationId),
    undoAction: controller.undoAction.bind(controller, conversationId),
  }
}
