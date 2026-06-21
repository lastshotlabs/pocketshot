import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { TypingIndicatorBase } from './standalone'
import type { TypingIndicatorConfig } from './types'

export function TypingIndicator({ config }: { config: TypingIndicatorConfig }) {
  const { values } = useScreenContext()

  const isTyping = resolveFromRef(config.isTyping, values) as boolean
  const userName =
    config.userName != null
      ? (resolveFromRef(config.userName, values) as string | undefined)
      : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TypingIndicatorBase
        id={config.id}
        testID={config.testID}
        isTyping={isTyping}
        userName={userName}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
