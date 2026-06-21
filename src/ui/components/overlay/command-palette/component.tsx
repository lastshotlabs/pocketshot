import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { CommandPaletteBase, type CommandPaletteItem } from './standalone'
import type { CommandPaletteConfig } from './types'

export function CommandPalette({ config }: { config: CommandPaletteConfig }) {
  const { getValue, setValue, dispatch } = useScreenContext()
  const isOpen = Boolean(getValue(`__commandPalette_${config.id}`))

  const handleClose = useCallback(() => {
    setValue(`__commandPalette_${config.id}`, false)
  }, [config.id, setValue])

  const items: CommandPaletteItem[] = useMemo(
    () =>
      config.items.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        icon: item.icon,
        shortcut: item.shortcut,
        group: item.group,
        onSelect: () => {
          void dispatch(item.onSelect)
        },
      })),
    [config.items, dispatch],
  )

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <CommandPaletteBase
        id={config.id}
        testID={config.testID}
        visible={isOpen}
        onClose={handleClose}
        items={items}
        placeholder={config.placeholder}
        maxResults={config.maxResults}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
