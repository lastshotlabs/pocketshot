import React, { useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { useTokens } from '../../../context/AppContext'
import { resolveNativeStyleProps, toNativeDimensionValue } from '../../_base'
import { LoadingStateBase, type LoadingStateVariant } from './standalone'
import type { LoadingStateConfig } from './types'

export function LoadingState({ config }: { config: LoadingStateConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedLabel =
    config.label == null
      ? undefined
      : isFromRef(config.label)
        ? String(resolveFromRef(config.label, values) ?? '')
        : config.label

  const skeletonFrame = useMemo(() => {
    const resolvedStyle = resolveNativeStyleProps(
      {
        height: config.height,
        borderRadius: config.borderRadius,
      },
      tokens,
    )
    return {
      height: toNativeDimensionValue(resolvedStyle.height) ?? 48,
      borderRadius:
        typeof resolvedStyle.borderRadius === 'number'
          ? resolvedStyle.borderRadius
          : tokens.radius.md,
    }
  }, [config.height, config.borderRadius, tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <LoadingStateBase
        variant={(config.variant ?? 'skeleton') as LoadingStateVariant}
        label={resolvedLabel}
        count={config.count ?? 3}
        height={skeletonFrame.height}
        borderRadius={skeletonFrame.borderRadius}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
