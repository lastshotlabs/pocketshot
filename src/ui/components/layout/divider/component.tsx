import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { useTokens } from '../../../context/AppContext'
import { DividerBase } from './standalone'
import type { DividerConfig } from './types'

export function Divider({ config }: { config: DividerConfig }) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const dividerColor = typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <DividerBase
        thickness={config.thickness}
        orientation={config.orientation as 'horizontal' | 'vertical' | undefined}
        color={dividerColor}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
