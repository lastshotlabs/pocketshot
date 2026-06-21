import React, { useCallback, useEffect, useRef } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { PinInputBase, type PinInputBaseHandle } from './standalone'
import type { PinInputConfig } from './types'

export function PinInput({ config }: { config: PinInputConfig }) {
  const { setValue, dispatch } = useScreenContext()
  const handleRef = useRef<PinInputBaseHandle>(null)

  // Expose shake() to ScreenContext under `${id}_shake` for legacy parity.
  useEffect(() => {
    setValue(`${config.id}_shake`, () => handleRef.current?.shake())
  }, [config.id, setValue])

  const handleChange = useCallback(
    (value: string) => {
      setValue(config.id, value)
    },
    [config.id, setValue],
  )

  const handleComplete = useCallback(
    (value: string) => {
      setValue(config.id, value)
      if (config.onComplete) void dispatch(config.onComplete)
    },
    [config.id, config.onComplete, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PinInputBase
        id={config.id}
        length={config.length}
        autoFocus={config.autoFocus}
        secureEntry={config.secureEntry}
        label={config.label}
        onChange={handleChange}
        onComplete={handleComplete}
        handleRef={handleRef}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
