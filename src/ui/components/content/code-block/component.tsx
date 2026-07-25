import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { CodeBlockBase } from './standalone'
import type { CodeBlockConfig } from './types'
import { CodeBlockSchema } from './schema'

export function CodeBlock({ config: inputConfig }: { config: CodeBlockConfig }) {
  const config = CodeBlockSchema.parse(inputConfig)
  const { values, dispatch } = useScreenContext()
  const code = resolveFromRef(config.code, values) as string

  const handleCopy = config.onCopy
    ? () => {
        void dispatch(config.onCopy!)
      }
    : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <CodeBlockBase
        code={code ?? ''}
        language={config.language}
        showLineNumbers={config.showLineNumbers}
        showCopyButton={config.showCopyButton}
        maxLines={config.maxLines}
        onCopy={handleCopy}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
