import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { TextareaBase } from './standalone'
import type { TextareaConfig } from './types'

export function Textarea({ config }: { config: TextareaConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined
  const resolvedError =
    config.errorText != null
      ? (resolveFromRef(config.errorText, values) as string | undefined)
      : undefined

  const handleChange = useCallback(
    (text: string) => {
      setValue(config.id, text)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const hasError = Boolean(resolvedError)
  const activeStates: ('invalid' | 'focus')[] | undefined = hasError ? ['invalid'] : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <TextareaBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onChangeText={handleChange}
        label={config.label}
        placeholder={config.placeholder}
        helperText={config.helperText}
        errorText={resolvedError}
        minRows={config.minRows}
        maxRows={config.maxRows}
        maxLength={config.maxLength}
        showCharCount={config.showCharCount}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
