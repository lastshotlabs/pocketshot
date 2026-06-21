import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, toNumericDimensionValue } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { ImageViewerBase } from './standalone'
import type { ImageViewerConfig } from './types'

export function ImageViewer({ config }: { config: ImageViewerConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const source = resolveFromRef(config.source, values) as string

  const resolvedStyle = resolveNativeStyleProps(
    {
      width: config.width,
      height: config.height,
      borderRadius: config.borderRadius,
    },
    tokens,
  )

  const widthValue = toNumericDimensionValue(resolvedStyle.width)
  const heightValue = toNumericDimensionValue(resolvedStyle.height)
  const borderRadiusValue =
    typeof resolvedStyle.borderRadius === 'number' ? resolvedStyle.borderRadius : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ImageViewerBase
        source={source}
        alt={config.alt}
        enableZoom={config.enableZoom}
        maxZoom={config.maxZoom}
        showCloseButton={config.showCloseButton}
        width={widthValue}
        height={heightValue}
        borderRadius={borderRadiusValue}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
