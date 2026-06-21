import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import { AuditLogBase, type AuditLogBaseEntry } from './standalone'
import type { AuditLogConfig, AuditEntry } from './types'

export function AuditLog({ config }: { config: AuditLogConfig }) {
  const { setValue, dispatch } = useScreenContext()
  const { data: fetchedData, isLoading, error } = useComponentData<AuditEntry[]>(config.data)

  const entries: AuditLogBaseEntry[] = Array.isArray(fetchedData)
    ? (fetchedData as AuditLogBaseEntry[])
    : []

  const handleItemPress = useCallback(
    async (entry: AuditLogBaseEntry) => {
      if (config.id) setValue(config.id, entry)
      if (config.onItemPress) await dispatch(config.onItemPress)
    },
    [config.id, config.onItemPress, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <AuditLogBase
        id={config.id}
        testID={config.testID}
        entries={entries}
        groupByDate={config.groupByDate}
        maxItems={config.maxItems}
        showActor={config.showActor}
        loading={isLoading}
        error={Boolean(error)}
        emptyMessage={config.emptyMessage}
        onItemPress={config.onItemPress ? handleItemPress : undefined}
      />
    </ComponentWrapper>
  )
}
