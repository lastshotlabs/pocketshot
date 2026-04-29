import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { LabelBase, type LabelSize, type LabelVariant } from './standalone'
import type { LabelConfig } from './types'

export function Label({ config }: { config: LabelConfig }) {
  const { values } = useScreenContext()
  const text = resolveFromRef(config.text, values) as string

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <LabelBase
        text={text}
        size={(config.size ?? 'sm') as LabelSize}
        variant={(config.variant ?? 'default') as LabelVariant}
        uppercase={config.uppercase}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID ?? config.id}
      />
    </ComponentWrapper>
  )
}
