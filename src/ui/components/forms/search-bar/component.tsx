import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { SearchBarBase } from './standalone'
import type { SearchBarConfig } from './types'

export function SearchBar({ config }: { config: SearchBarConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const handleChange = useCallback(
    (text: string) => {
      setValue(config.id, text)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const handleSubmit = useCallback(
    (text: string) => {
      setValue(config.id, text)
      if (config.onSubmitAction) void dispatch(config.onSubmitAction)
    },
    [config.id, config.onSubmitAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SearchBarBase
        id={config.id}
        onChangeText={handleChange}
        onSubmit={handleSubmit}
        placeholder={config.placeholder}
        autoFocus={config.autoFocus}
        showCancelButton={config.showCancelButton}
        debounceMs={config.debounceMs}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
