import React, { useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { resolveNativeStyleProps, toNativeDimensionValue } from '../../_base'
import { SkeletonBase, type SkeletonVariant } from './standalone'
import type { SkeletonConfig } from './types'

export function Skeleton({ config }: { config: SkeletonConfig }) {
  const tokens = useTokens()

  const frame = useMemo(() => {
    const resolvedStyle = resolveNativeStyleProps(
      {
        width: config.width,
        height: config.height,
        borderRadius: config.borderRadius,
      },
      tokens,
    )
    return {
      width: toNativeDimensionValue(resolvedStyle.width) ?? '100%',
      height: toNativeDimensionValue(resolvedStyle.height) ?? 48,
      borderRadius:
        typeof resolvedStyle.borderRadius === 'number'
          ? resolvedStyle.borderRadius
          : tokens.radius.md,
    }
  }, [config.width, config.height, config.borderRadius, tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SkeletonBase
        variant={(config.variant ?? 'text') as SkeletonVariant}
        count={config.count ?? 1}
        lines={config.lines ?? 3}
        width={frame.width}
        height={frame.height}
        borderRadius={frame.borderRadius}
        animated={config.animated !== false}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
