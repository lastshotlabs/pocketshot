import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { PopoverBase, type PopoverPosition } from './standalone'
import type { PopoverConfig } from './types'

export function Popover({ config }: { config: PopoverConfig }) {
  const { setValue } = useScreenContext()
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setValue(config.id, open)
    },
    [config.id, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PopoverBase
        id={config.id}
        testID={config.testID}
        triggerLabel={config.triggerLabel}
        triggerIcon={config.triggerIcon}
        title={config.title}
        content={config.content}
        position={(config.position ?? 'bottom') as PopoverPosition}
        closeOnBackdrop={config.closeOnBackdrop ?? true}
        onOpenChange={handleOpenChange}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
