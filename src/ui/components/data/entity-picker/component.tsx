import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { EntityPickerBase, type EntityOption } from './standalone'
import type { EntityPickerConfig } from './types'

export function EntityPicker({ config }: { config: EntityPickerConfig }) {
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedData = useMemo<EntityOption[]>(() => {
    if (isFromRef(config.data)) {
      const resolved = resolveFromRef(config.data, values)
      return Array.isArray(resolved) ? (resolved as EntityOption[]) : []
    }
    return config.data as EntityOption[]
  }, [config.data, values])

  const resolvedValue = useMemo<string | undefined>(() => {
    if (config.value == null) return undefined
    if (isFromRef(config.value)) {
      const resolved = resolveFromRef(config.value, values)
      return typeof resolved === 'string' ? resolved : undefined
    }
    return typeof config.value === 'string' ? config.value : undefined
  }, [config.value, values])

  const handleChange = useCallback(
    async (next: string | undefined) => {
      setValue(config.id, next ?? null)
      if (config.onChangeAction) {
        await dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <EntityPickerBase
        data={resolvedData}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        label={config.label}
        placeholder={config.placeholder}
        searchPlaceholder={config.searchPlaceholder}
        emptyMessage={config.emptyMessage}
        searchable={config.searchable !== false}
        clearable={config.clearable !== false}
        onChange={(v) => void handleChange(v)}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
