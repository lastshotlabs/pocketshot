import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { RowBase } from './standalone'
import type { RowConfig } from './types'

export function Row({ config, children }: { config: RowConfig; children?: React.ReactNode }) {
  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RowBase
        gap={config.gap as string | number | undefined}
        alignItems={config.alignItems as 'start' | 'center' | 'end' | 'stretch' | 'baseline' | undefined}
        justifyContent={config.justifyContent as 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | undefined}
        flexWrap={config.flexWrap as 'nowrap' | 'wrap' | 'wrap-reverse' | undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </RowBase>
    </ComponentWrapper>
  )
}
