import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { HeadingBase, type HeadingLevel } from './standalone'
import type { HeadingConfig } from './types'

export function Heading({ config }: { config: HeadingConfig }) {
  const { values } = useScreenContext()
  const text = resolveFromRef(config.text, values) as string

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <HeadingBase
        text={text}
        level={(config.level ?? 2) as HeadingLevel}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID ?? config.id}
      />
    </ComponentWrapper>
  )
}
