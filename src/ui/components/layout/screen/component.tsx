import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { ScreenBase } from './standalone'
import type { ScreenConfig } from './types'

type Edge = 'top' | 'bottom' | 'left' | 'right'

export function Screen({ config, children }: { config: ScreenConfig; children?: React.ReactNode }) {
  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>
      <ScreenBase
        scrollable={config.scrollable}
        padding={config.padding as string | number | undefined}
        edges={config.edges as Edge[] | undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID ?? config.id}
      >
        {children}
      </ScreenBase>
    </ComponentWrapper>
  )
}
