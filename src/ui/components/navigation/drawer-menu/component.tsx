import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import {
  DrawerMenuBase,
  type DrawerMenuFooter,
  type DrawerMenuItem,
  type DrawerMenuPosition,
} from './standalone'
import type { DrawerMenuConfig } from './types'

export function DrawerMenu({ config }: { config: DrawerMenuConfig }) {
  const { getValue, setValue, dispatch } = useScreenContext()
  const contextKey = `__drawerMenu_${config.id}`
  const isOpen = Boolean(getValue(contextKey))

  const handleClose = useCallback(() => {
    setValue(contextKey, false)
  }, [contextKey, setValue])

  const items: DrawerMenuItem[] = useMemo(
    () =>
      config.items.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
        section: item.section,
        onPress: () => {
          setValue(`${config.id}_activeItem`, item.id)
          if (item.onPress) void dispatch(item.onPress)
        },
      })),
    [config.id, config.items, dispatch, setValue],
  )

  const footer: DrawerMenuFooter | undefined = useMemo(() => {
    if (!config.footer) return undefined
    return {
      label: config.footer.label,
      onPress: () => {
        void dispatch(config.footer!.onPress)
      },
    }
  }, [config.footer, dispatch])

  const activeItemId = getValue(`${config.id}_activeItem`) as string | undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <DrawerMenuBase
        id={config.id}
        testID={config.testID}
        visible={isOpen}
        onClose={handleClose}
        items={items}
        header={config.header}
        footer={footer}
        activeItemId={activeItemId}
        position={(config.position ?? 'left') as DrawerMenuPosition}
        widthPercent={config.widthPercent ?? 80}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
