import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { CompareViewBase } from './standalone'
import type { CompareViewConfig } from './types'

export function CompareView({ config }: { config: CompareViewConfig }) {
  const { values } = useScreenContext()
  const leftContent = String(resolveFromRef(config.left.content, values) ?? '')
  const rightContent = String(resolveFromRef(config.right.content, values) ?? '')

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <CompareViewBase
        left={{ label: config.left.label, content: leftContent }}
        right={{ label: config.right.label, content: rightContent }}
        mode={config.mode}
        showLineNumbers={config.showLineNumbers}
        highlightDiffs={config.highlightDiffs}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
