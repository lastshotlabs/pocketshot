import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { EmptyStateBase } from './standalone'
import type { EmptyStateConfig } from './types'

export function EmptyState({ config }: { config: EmptyStateConfig }) {
  const { dispatch } = useScreenContext()

  const handleActionPress = useCallback(async () => {
    if (!config.action?.onPress) return
    await dispatch(config.action.onPress)
  }, [config.action, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <EmptyStateBase
        title={config.title ?? 'Nothing here yet'}
        description={config.description}
        icon={config.icon}
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
