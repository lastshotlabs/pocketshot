import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { SectionBase } from './standalone'
import type { SectionConfig } from './types'

export function Section({
  config,
  children,
}: {
  config: SectionConfig
  children?: React.ReactNode
}) {
  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SectionBase
        title={config.title}
        description={config.description}
        titleSize={config.titleSize as 'sm' | 'md' | 'lg' | undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </SectionBase>
    </ComponentWrapper>
  )
}
