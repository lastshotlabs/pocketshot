import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { LocationInputBase, type LocationValue } from './standalone'
import type { LocationInputConfig } from './types'
import { LocationInputSchema } from './schema'

export function LocationInput({ config: inputConfig }: { config: LocationInputConfig }) {
  const config = LocationInputSchema.parse(inputConfig)
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedDefault =
    config.defaultValue != null
      ? resolveFromRef<LocationValue>(config.defaultValue, values)
      : undefined

  const handleChange = useCallback(
    (next: LocationValue | null) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <LocationInputBase
        id={config.id}
        defaultValue={resolvedDefault ?? null}
        onChange={handleChange}
        label={config.label}
        placeholder={config.placeholder}
        showPreview={config.showPreview}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
