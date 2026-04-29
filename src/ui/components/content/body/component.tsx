import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { BodyBase } from './standalone'
import type { BodyConfig } from './types'

export function Body({ config }: { config: BodyConfig }) {
  const { values } = useScreenContext()
  const text = resolveFromRef(config.text, values) as string

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <BodyBase
        text={text}
        numberOfLines={config.numberOfLines}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID ?? config.id}
      />
    </ComponentWrapper>
  )
}
