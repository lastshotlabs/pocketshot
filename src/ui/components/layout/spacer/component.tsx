import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import type { SpacerConfig } from './types'

export function Spacer({ config }: { config: SpacerConfig }) {
  const tokens = useTokens()
  const spacing = tokens.spacing

  if (config.flex) {
    return <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>{null}</ComponentWrapper>
  }

  const size = spacing[config.size as keyof typeof spacing] ?? config.size ?? 0
  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={{ width: size, height: size }}
    >
      {null}
    </ComponentWrapper>
  )
}
