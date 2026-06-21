import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { FilterSheetBase, type FilterSheetSection, type FilterSheetState } from './standalone'
import type { FilterSheetConfig } from './types'

export function FilterSheet({ config }: { config: FilterSheetConfig }) {
  const { getValue, setValue, dispatch } = useScreenContext()

  const isOpen = Boolean(getValue(`__filterSheet_${config.id}`))

  const handleClose = useCallback(() => {
    setValue(`__filterSheet_${config.id}`, false)
  }, [config.id, setValue])

  const handleApply = useCallback(
    async (state: FilterSheetState) => {
      if (config.id) {
        setValue(config.id, state)
      }
      await dispatch(config.onApply)
    },
    [config.id, config.onApply, dispatch, setValue],
  )

  const handleReset = useCallback(async () => {
    if (config.id) {
      setValue(config.id, {})
    }
    if (config.onReset) {
      await dispatch(config.onReset)
    }
  }, [config.id, config.onReset, dispatch, setValue])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FilterSheetBase
        open={isOpen}
        onClose={handleClose}
        title={config.title ?? 'Filters'}
        sections={config.sections as FilterSheetSection[]}
        onApply={(s) => void handleApply(s)}
        onReset={config.onReset ? () => void handleReset() : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
