import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { MultiSelectBase } from './standalone'
import type { MultiSelectConfig } from './types'

export function MultiSelect({ config }: { config: MultiSelectConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null
      ? (resolveFromRef(config.value, values) as string[] | undefined)
      : undefined
  const label =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const placeholder =
    config.placeholder != null
      ? String(resolveFromRef(config.placeholder, values) ?? '')
      : undefined
  const emptyMessage =
    config.emptyMessage != null
      ? String(resolveFromRef(config.emptyMessage, values) ?? '')
      : undefined

  const handleChange = useCallback(
    (next: string[]) => {
      setValue(config.id, next)
      if (config.onChangeAction != null) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <MultiSelectBase
        id={config.id}
        options={config.options}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onChange={handleChange}
        label={label}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        maxSelections={config.maxSelections}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
