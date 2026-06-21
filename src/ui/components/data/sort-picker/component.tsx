import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { isFromRef, resolveFromRef } from '../../_base'
import { SortPickerBase, type SortPickerOption } from './standalone'
import type { SortPickerConfig } from './types'

export function SortPicker({ config }: { config: SortPickerConfig }) {
  const { getValue, setValue, dispatch, values } = useScreenContext()

  const isOpen = Boolean(getValue(`__sortPicker_${config.id}`))

  const resolvedValue = useMemo<string | undefined>(() => {
    if (isFromRef(config.value)) {
      const resolved = resolveFromRef(config.value, values)
      return typeof resolved === 'string' ? resolved : undefined
    }
    return typeof config.value === 'string' ? config.value : undefined
  }, [config.value, values])

  const handleClose = useCallback(() => {
    setValue(`__sortPicker_${config.id}`, false)
  }, [config.id, setValue])

  const handleSelect = useCallback(
    async (option: SortPickerOption) => {
      if (config.id) {
        setValue(config.id, option.value)
      }
      await dispatch(config.onSelect)
    },
    [config.id, config.onSelect, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SortPickerBase
        open={isOpen}
        onClose={handleClose}
        options={config.options}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onSelect={(o) => void handleSelect(o)}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
