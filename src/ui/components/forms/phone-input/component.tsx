import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { PhoneInputBase, type PhoneInputValue } from './standalone'
import type { PhoneInputConfig } from './types'

export function PhoneInput({ config }: { config: PhoneInputConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const handleChange = useCallback(
    (value: PhoneInputValue) => {
      setValue(config.id, value)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PhoneInputBase
        id={config.id}
        defaultCountry={config.defaultCountry}
        onChange={handleChange}
        label={config.label}
        placeholder={config.placeholder}
        helperText={config.helperText}
        errorText={config.errorText}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
