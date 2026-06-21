import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { MarkdownBase, parseMarkdown } from './standalone'
import type { MarkdownConfig } from './types'

export { parseMarkdown }

export function Markdown({ config }: { config: MarkdownConfig }) {
  const { values } = useScreenContext()
  const content = resolveFromRef(config.content, values) as string

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <MarkdownBase
        content={content ?? ''}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
