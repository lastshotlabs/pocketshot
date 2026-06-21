import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { VideoPlayerBase } from './standalone'
import type { VideoPlayerConfig } from './types'

export function VideoPlayer({ config }: { config: VideoPlayerConfig }) {
  const { values } = useScreenContext()

  const source = String(resolveFromRef(config.source, values) ?? '')
  const poster =
    config.poster != null ? String(resolveFromRef(config.poster, values) ?? '') : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <VideoPlayerBase
        source={source}
        poster={poster}
        autoPlay={config.autoPlay}
        loop={config.loop}
        muted={config.muted}
        controls={config.controls}
        aspectRatio={config.aspectRatio}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
