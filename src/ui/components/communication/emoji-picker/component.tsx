import React, { useCallback, useEffect, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { EmojiPickerBase } from './standalone'
import type { EmojiPickerConfig } from './types'
import { EmojiPickerSchema } from './schema'

export function EmojiPicker({ config: inputConfig }: { config: EmojiPickerConfig }) {
  const config = EmojiPickerSchema.parse(inputConfig)
  const { dispatch, setValue } = useScreenContext()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, visible, setValue])

  const handleOpen = useCallback(() => setVisible(true), [])
  const handleClose = useCallback(() => setVisible(false), [])

  const handleSelect = useCallback(
    (emoji: string) => {
      setValue('__selectedEmoji', { emoji })
      setVisible(false)
      void dispatch(config.onSelect)
    },
    [setValue, dispatch, config.onSelect],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <EmojiPickerBase
        id={config.id}
        testID={config.testID}
        visible={visible}
        showTrigger
        onOpen={handleOpen}
        onClose={handleClose}
        onSelect={handleSelect}
        categories={config.categories}
        recentEmojis={config.recentEmojis}
      />
    </ComponentWrapper>
  )
}
