import React, { useMemo, type ReactNode } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ContextMenuBase, type ContextMenuItem } from './standalone'
import type { ContextMenuConfig } from './types'

export interface ContextMenuProps {
  config: ContextMenuConfig
  children?: ReactNode
}

export function ContextMenu({ config, children }: ContextMenuProps) {
  const { dispatch } = useScreenContext()

  const items: ContextMenuItem[] = useMemo(
    () =>
      config.items.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        destructive: item.destructive,
        disabled: item.disabled,
        onPress: () => {
          void dispatch(item.onPress)
        },
      })),
    [config.items, dispatch],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ContextMenuBase
        id={config.id}
        testID={config.testID}
        items={items}
        triggerLabel={config.triggerLabel}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </ContextMenuBase>
    </ComponentWrapper>
  )
}
