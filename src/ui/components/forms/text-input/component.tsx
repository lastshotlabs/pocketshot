import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { TextInputBase } from './standalone'
import type { TextInputConfig } from './types'

export function TextInput({ config }: { config: TextInputConfig }) {
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

  const handleSubmit = useCallback(() => {
    if (config.onSubmitAction) void dispatch(config.onSubmitAction)
  }, [config.onSubmitAction, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TextInputBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        label={config.label}
        placeholder={config.placeholder}
        helperText={config.helperText}
        errorText={resolvedError}
        secureTextEntry={config.secureTextEntry}
        keyboardType={config.keyboardType}
        autoCapitalize={config.autoCapitalize}
        autoComplete={config.autoComplete}
        multiline={config.multiline}
        numberOfLines={config.numberOfLines}
        maxLength={config.maxLength}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
