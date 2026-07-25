import React, { useCallback, useEffect, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ReactionPickerBase } from './standalone'
import type { ReactionPickerConfig } from './types'
import { ReactionPickerSchema } from './schema'

export function ReactionPicker({ config: inputConfig }: { config: ReactionPickerConfig }) {
  const config = ReactionPickerSchema.parse(inputConfig)
  const { dispatch, setValue } = useScreenContext()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, visible, setValue])

  const handleOpen = useCallback(() => setVisible(true), [])
  const handleClose = useCallback(() => setVisible(false), [])

  const handleSelect = useCallback(
    (emoji: string) => {
      setValue('__selectedReaction', { emoji })
      setVisible(false)
      void dispatch(config.onSelect)
    },
    [setValue, dispatch, config.onSelect],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ReactionPickerBase
        id={config.id}
        testID={config.testID}
        visible={visible}
        showTrigger
        onOpen={handleOpen}
        onClose={handleClose}
        onSelect={handleSelect}
        reactions={config.reactions}
        triggerLabel={config.triggerLabel}
      />
    </ComponentWrapper>
  )
}
