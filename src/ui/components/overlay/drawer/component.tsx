import React, { useCallback, type ReactNode } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { DrawerBase, type DrawerPosition } from './standalone'
import type { DrawerConfig } from './types'

/**
 * Config-driven side drawer. Open/close via ScreenContext key `__drawer_{id}`.
 */
export function Drawer({ config, children }: { config: DrawerConfig; children?: ReactNode }) {
  const { getValue, setValue } = useScreenContext()
  const isOpen = Boolean(getValue(`__drawer_${config.id}`))

  const handleClose = useCallback(() => {
    setValue(`__drawer_${config.id}`, false)
  }, [setValue, config.id])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <DrawerBase
        id={config.id}
        testID={config.testID}
        visible={isOpen}
        onClose={handleClose}
        title={config.title}
        position={(config.position ?? 'left') as DrawerPosition}
        widthPercent={config.widthPercent ?? 80}
        showHandle={config.showHandle ?? true}
        closeOnBackdrop={config.closeOnBackdrop ?? true}
        content={config.content}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </DrawerBase>
    </ComponentWrapper>
  )
}
