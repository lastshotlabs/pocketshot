import React, { useCallback, useEffect, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { RichInputBase } from './standalone'
import type { RichInputConfig, ToolbarItem } from './types'

export function RichInput({ config }: { config: RichInputConfig }) {
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedLabel =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const resolvedPlaceholder =
    config.placeholder != null
      ? String(resolveFromRef(config.placeholder, values) ?? '')
      : undefined

  const [localValue, setLocalValue] = useState<string>(
    String(resolvedValue ?? config.defaultValue ?? ''),
  )

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(String(resolvedValue))
    }
  }, [resolvedValue])

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      setValue(config.id, text)
      if (config.onChangeAction != null) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RichInputBase
        value={localValue}
        label={resolvedLabel}
        placeholder={resolvedPlaceholder}
        toolbar={config.toolbar as ToolbarItem[] | undefined}
        minRows={config.minRows}
        maxRows={config.maxRows}
        onChangeText={handleChange}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
