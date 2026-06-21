import React, { useCallback, useEffect, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { TabsBase, type TabsVariant } from './standalone'
import type { TabsConfig } from './types'

/**
 * Config-driven tab bar. Publishes the active tab id to ScreenContext under
 * `config.id`, enabling other components to react via `{ from: config.id }`.
 */
export function Tabs({ config }: { config: TabsConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedActiveTab =
    config.activeTab != null
      ? (resolveFromRef(config.activeTab, values) as string | undefined)
      : undefined
  const defaultTab = config.defaultTab ?? config.tabs[0]?.id ?? ''
  const [localActive, setLocalActive] = useState<string>(resolvedActiveTab ?? defaultTab)
  const activeTab = resolvedActiveTab ?? localActive

  useEffect(() => {
    if (resolvedActiveTab != null) setLocalActive(resolvedActiveTab)
  }, [resolvedActiveTab])

  useEffect(() => {
    setValue(config.id, activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTabChange = useCallback(
    (tabId: string) => {
      setLocalActive(tabId)
      setValue(config.id, tabId)
      setValue('__activeTab', tabId)
      if (config.onTabChange) void dispatch(config.onTabChange)
    },
    [config.id, config.onTabChange, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TabsBase
        id={config.id}
        testID={config.testID}
        tabs={config.tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        variant={config.variant as TabsVariant}
        onTabChange={handleTabChange}
      />
    </ComponentWrapper>
  )
}
