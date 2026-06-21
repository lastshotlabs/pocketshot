import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { BackButtonBase } from './standalone'
import type { BackButtonConfig } from './types'

export function BackButton({ config }: { config: BackButtonConfig }) {
  const { dispatch } = useScreenContext()

  const handlePress = useCallback(() => {
    const action = config.action ?? { type: 'navigate' as const, to: '..' }
    void dispatch(action)
  }, [config.action, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <BackButtonBase
        id={config.id}
        testID={config.testID}
        label={config.label}
        onPress={handlePress}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
