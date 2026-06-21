import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { QrCodeBase } from './standalone'
import type { QrCodeConfig } from './types'

export function QrCode({ config }: { config: QrCodeConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const value = resolveFromRef(config.value, values) as string
  const resolvedStyle = resolveNativeStyleProps(
    {
      color: config.color,
      bg: config.bg,
    },
    tokens,
  )
  const color = typeof resolvedStyle.color === 'string' ? resolvedStyle.color : undefined
  const bg =
    typeof resolvedStyle.backgroundColor === 'string' ? resolvedStyle.backgroundColor : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <QrCodeBase
        value={value}
        size={config.size}
        color={color}
        bg={bg}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
