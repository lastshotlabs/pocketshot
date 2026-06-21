import React, { useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { resolveNativeStyleProps, toNumericDimensionValue } from '../../_base'
import { ChartBase, type ChartDataItem, type ChartType } from './standalone'
import type { ChartConfig } from './types'

export function Chart({ config }: { config: ChartConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedData = useMemo<ChartDataItem[]>(() => {
    if (isFromRef(config.data)) {
      const ref = resolveFromRef(config.data, values)
      return Array.isArray(ref) ? (ref as ChartDataItem[]) : []
    }
    return config.data as ChartDataItem[]
  }, [config.data, values])

  const height = useMemo(() => {
    const resolvedStyle = resolveNativeStyleProps({ height: config.height }, tokens)
    return toNumericDimensionValue(resolvedStyle.height) ?? 200
  }, [config.height, tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ChartBase
        type={(config.type ?? 'bar') as ChartType}
        data={resolvedData}
        title={config.title}
        height={height}
        showLabels={config.showLabels ?? true}
        showValues={config.showValues ?? false}
        showLegend={config.showLegend}
        animated={config.animated ?? true}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
