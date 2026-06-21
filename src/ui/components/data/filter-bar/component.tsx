import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { FilterBarBase } from './standalone'
import type { FilterBarConfig } from './types'

export function FilterBar({ config }: { config: FilterBarConfig }) {
  const { dispatch, setValue, values } = useScreenContext()
  const isMultiSelect = Boolean(config.multiSelect)

  const controlledValue: string | string[] | undefined = useMemo(() => {
    if (isFromRef(config.value)) {
      return resolveFromRef<string | string[]>(
        config.value as unknown as string | string[],
        values,
      )
    }
    return config.value as string | string[] | undefined
  }, [config.value, values])

  const handleChange = useCallback(
    async (next: string | string[]) => {
      const publishValue = isMultiSelect
        ? (Array.isArray(next) ? next : [next])
        : (Array.isArray(next) ? (next[0] ?? null) : next || null)
      if (config.id) {
        setValue(config.id, publishValue)
      }
      if (config.onChangeAction) {
        await dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, isMultiSelect, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FilterBarBase
        filters={config.filters}
        value={controlledValue}
        defaultValue={config.defaultValue}
        multiSelect={isMultiSelect}
        showAllOption={config.showAllOption !== false}
        allLabel={config.allLabel ?? 'All'}
        onChange={(v) => void handleChange(v)}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
