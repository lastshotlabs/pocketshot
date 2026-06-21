import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { AlertBase, type AlertVariant } from './standalone'
import type { AlertConfig } from './types'

export function Alert({ config }: { config: AlertConfig }) {
  const { dispatch } = useScreenContext()

  const handleDismiss = useCallback(async () => {
    if (config.onDismiss) {
      await dispatch(config.onDismiss)
    }
  }, [config.onDismiss, dispatch])

  const handleActionPress = useCallback(async () => {
    if (!config.action) return
    await dispatch(config.action.onPress)
  }, [config.action, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <AlertBase
        title={config.title}
        body={config.body}
        variant={(config.variant ?? 'default') as AlertVariant}
        icon={config.icon}
        dismissible={config.dismissible}
        onDismiss={config.onDismiss ? handleDismiss : undefined}
        action={
          config.action
            ? { label: config.action.label, onPress: () => void handleActionPress() }
            : undefined
        }
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
