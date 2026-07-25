import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { StackBase } from './standalone'
import type { StackConfig } from './types'

export function Stack({ config, children }: { config: StackConfig; children?: React.ReactNode }) {
  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <StackBase
        gap={config.gap as string | number | undefined}
        alignItems={
          config.alignItems as StackConfig['alignItems'] extends infer A
            ? A & ('start' | 'center' | 'end' | 'stretch' | 'baseline')
            : never
        }
        justifyContent={
          config.justifyContent as
            | 'start'
            | 'center'
            | 'end'
            | 'between'
            | 'around'
            | 'evenly'
            | undefined
        }
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </StackBase>
    </ComponentWrapper>
  )
}
