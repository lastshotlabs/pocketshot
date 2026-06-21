import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { QuickAddBase } from './standalone'
import type { QuickAddConfig } from './types'

export function QuickAdd({ config }: { config: QuickAddConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const handleSubmit = useCallback(
    (text: string) => {
      setValue(config.id, text)
      void dispatch(config.onSubmit)
    },
    [config.id, config.onSubmit, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <QuickAddBase
        id={config.id}
        onSubmit={handleSubmit}
        placeholder={config.placeholder}
        icon={config.icon}
        submitLabel={config.submitLabel}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
