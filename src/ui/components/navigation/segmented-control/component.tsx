import React, { useCallback, useEffect, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { SegmentedControlBase } from './standalone'
import type { SegmentedControlConfig } from './types'

/**
 * Config-driven segmented control. All segments visible, one selected.
 * Publishes selected value to ScreenContext under `config.id`.
 */
export function SegmentedControl({ config }: { config: SegmentedControlConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined
  const defaultValue = config.defaultValue ?? config.options[0]?.value ?? ''
  const [localValue, setLocalValue] = useState<string>(resolvedValue ?? defaultValue)
  const activeValue = resolvedValue ?? localValue

  useEffect(() => {
    if (resolvedValue != null) setLocalValue(resolvedValue)
  }, [resolvedValue])

  useEffect(() => {
    setValue(config.id, activeValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = useCallback(
    (optionValue: string) => {
      setLocalValue(optionValue)
      setValue(config.id, optionValue)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SegmentedControlBase
        id={config.id}
        testID={config.testID}
        options={config.options}
        value={activeValue}
        onChange={handleChange}
      />
    </ComponentWrapper>
  )
}
