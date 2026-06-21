import React, { useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { DropdownMenuBase, type DropdownMenuAlign, type DropdownMenuItem } from './standalone'
import type { DropdownMenuConfig } from './types'

export function DropdownMenu({ config }: { config: DropdownMenuConfig }) {
  const { dispatch } = useScreenContext()

  const items: DropdownMenuItem[] = useMemo(
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
      <DropdownMenuBase
        id={config.id}
        testID={config.testID}
        trigger={{ label: config.trigger.label, icon: config.trigger.icon }}
        items={items}
        align={(config.align ?? 'start') as DropdownMenuAlign}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
