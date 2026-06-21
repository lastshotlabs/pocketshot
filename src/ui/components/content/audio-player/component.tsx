import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { AudioPlayerBase } from './standalone'
import type { AudioPlayerConfig } from './types'

export function AudioPlayer({ config }: { config: AudioPlayerConfig }) {
  const { values } = useScreenContext()
  const source = String(resolveFromRef(config.source, values) ?? '')
  const title =
    config.title != null ? String(resolveFromRef(config.title, values) ?? '') : undefined
  const artist =
    config.artist != null ? String(resolveFromRef(config.artist, values) ?? '') : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <AudioPlayerBase
        source={source}
        title={title}
        artist={artist}
        showWaveform={config.showWaveform}
        autoPlay={config.autoPlay}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
