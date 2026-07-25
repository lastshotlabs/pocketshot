import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { InlineEditBase } from './standalone'
import type { InlineEditConfig } from './types'

export function InlineEdit({ config }: { config: InlineEditConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? String(resolveFromRef(config.value, values) ?? '') : undefined
  const placeholder =
    config.placeholder != null
      ? String(resolveFromRef(config.placeholder, values) ?? '')
      : undefined
  const prefix =
    config.prefix != null ? String(resolveFromRef(config.prefix, values) ?? '') : undefined
  const suffix =
    config.suffix != null ? String(resolveFromRef(config.suffix, values) ?? '') : undefined
  const emptyText =
    config.emptyText != null ? String(resolveFromRef(config.emptyText, values) ?? '') : undefined

  const handleSave = useCallback(
    (next: string) => {
      setValue(config.id, next)
      if (config.onSaveAction != null) void dispatch(config.onSaveAction)
    },
    [config.id, config.onSaveAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <InlineEditBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onSave={handleSave}
        placeholder={placeholder}
        prefix={prefix}
        suffix={suffix}
        emptyText={emptyText}
        inputType={config.inputType}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
