import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { BottomTabBarBase, type BottomTabItem } from './standalone'
import type { BottomTabBarConfig } from './types'

export function BottomTabBar({ config }: { config: BottomTabBarConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedActiveTab =
    config.activeTab != null
      ? (resolveFromRef(config.activeTab, values) as string | undefined)
      : undefined

  const defaultTab = config.tabs[0]?.id ?? ''
  const [localActive, setLocalActive] = useState<string>(resolvedActiveTab ?? defaultTab)
  const activeTab = resolvedActiveTab ?? localActive

  useEffect(() => {
    if (resolvedActiveTab != null) setLocalActive(resolvedActiveTab)
  }, [resolvedActiveTab])

  useEffect(() => {
    setValue(config.id, activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs: BottomTabItem[] = useMemo(
    () =>
      config.tabs.map((tab) => {
        const resolvedBadge =
          tab.badge != null
            ? (resolveFromRef(tab.badge, values) as number | undefined)
            : undefined
        return {
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          badge: resolvedBadge,
        }
      }),
    [config.tabs, values],
  )

  const handleTabChange = useCallback(
    (tabId: string) => {
      setLocalActive(tabId)
      setValue(config.id, tabId)
      const tab = config.tabs.find((t) => t.id === tabId)
      if (tab?.onPress) void dispatch(tab.onPress)
    },
    [config.id, config.tabs, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <BottomTabBarBase
        id={config.id}
        testID={config.testID}
        tabs={tabs}
        activeTab={activeTab}
        elevated={config.elevated ?? true}
        showLabels={config.showLabels ?? true}
        onTabChange={handleTabChange}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
