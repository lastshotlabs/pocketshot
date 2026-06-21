import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { SaveIndicatorBase, type SaveIndicatorStatus } from './standalone'
import type { SaveIndicatorConfig } from './types'

export function SaveIndicator({ config }: { config: SaveIndicatorConfig }) {
  const { values } = useScreenContext()

  const resolvedStatus: SaveIndicatorStatus = isFromRef(config.status)
    ? (String(resolveFromRef(config.status, values) ?? 'idle') as SaveIndicatorStatus)
    : ((config.status as SaveIndicatorStatus) ?? 'idle')

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SaveIndicatorBase
        status={resolvedStatus}
        savingLabel={config.savingLabel}
        savedLabel={config.savedLabel}
        errorLabel={config.errorLabel}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
