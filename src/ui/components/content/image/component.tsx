import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { ImageBase } from './standalone'
import type { ImageConfig } from './types'

export function ConfigImage({ config }: { config: ImageConfig }) {
  const { values, dispatch } = useScreenContext()
  const src = resolveFromRef(config.src, values) as string

  const handlePress = useCallback(() => {
    if (!config.onPress) return
    void dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ImageBase
        src={src}
        alt={config.alt}
        width={config.width as number | string | undefined}
        height={config.height as number | string | undefined}
        aspectRatio={config.aspectRatio}
        borderRadius={config.borderRadius as number | string | undefined}
        resizeMode={config.resizeMode}
        onPress={config.onPress ? handlePress : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID ?? config.id}
      />
    </ComponentWrapper>
  )
}
