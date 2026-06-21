import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { SpacerBase } from './standalone'
import type { SpacerConfig } from './types'

export function Spacer({ config }: { config: SpacerConfig }) {
  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SpacerBase
        size={config.size as number | string | undefined}
        flex={config.flex}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
