import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { RichTextViewerBase } from './standalone'
import type { RichTextViewerConfig } from './types'

export function RichTextViewer({ config }: { config: RichTextViewerConfig }) {
  const { values } = useScreenContext()
  const content = String(resolveFromRef(config.content, values) ?? '')

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RichTextViewerBase
        content={content}
        maxLines={config.maxLines}
        showExpandButton={config.showExpandButton}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
