import React, { useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { MediaPickerBase } from './standalone'
import type { MediaPickerConfig, SelectedMediaItem } from './types'

export function MediaPicker({ config }: { config: MediaPickerConfig }) {
  const { setValue, dispatch } = useScreenContext()
  const [items, setItems] = useState<SelectedMediaItem[]>([])

  const handleChange = (next: SelectedMediaItem[]) => {
    setItems(next)
    setValue(config.id, next)
  }

  const handleSelect = (next: SelectedMediaItem[]) => {
    setItems(next)
    setValue(config.id, next)
    void dispatch(config.onSelect)
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <MediaPickerBase
        mediaTypes={config.mediaTypes}
        maxSelections={config.maxSelections}
        quality={config.quality}
        value={items}
        onChange={handleChange}
        onSelect={handleSelect}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
