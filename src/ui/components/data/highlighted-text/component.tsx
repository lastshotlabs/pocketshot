import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { HighlightedTextBase } from './standalone'
import type { HighlightedTextConfig } from './types'

export function HighlightedText({ config }: { config: HighlightedTextConfig }) {
  const { values } = useScreenContext()

  const resolvedText = isFromRef(config.text)
    ? String(resolveFromRef(config.text, values) ?? '')
    : config.text
  const resolvedHighlight = isFromRef(config.highlight)
    ? String(resolveFromRef(config.highlight, values) ?? '')
    : config.highlight
  const resolvedHighlights = isFromRef(config.highlights)
    ? ((resolveFromRef(config.highlights, values) as unknown as string[]) ?? [])
    : ((config.highlights as string[] | undefined) ?? [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <HighlightedTextBase
        text={resolvedText}
        highlight={resolvedHighlight}
        highlights={resolvedHighlights}
        highlightColor={config.highlightColor}
        highlightForeground={config.highlightForeground}
        caseSensitive={config.caseSensitive}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
