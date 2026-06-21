import React, { useCallback, type ReactNode } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { BottomSheetBase } from './standalone'
import type { BottomSheetConfig } from './types'

export interface BottomSheetProps {
  config: BottomSheetConfig
  children?: ReactNode
}

export function BottomSheet({ config, children }: BottomSheetProps) {
  const { getValue, setValue } = useScreenContext()
  const isOpen = Boolean(getValue(`__sheet_${config.id}`))

  const handleClose = useCallback(() => {
    setValue(`__sheet_${config.id}`, false)
  }, [config.id, setValue])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <BottomSheetBase
        id={config.id}
        testID={config.testID}
        visible={isOpen}
        onClose={handleClose}
        title={config.title}
        snapPoints={config.snapPoints}
        showHandle={config.showHandle}
        closeOnBackdrop={config.closeOnBackdrop}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </BottomSheetBase>
    </ComponentWrapper>
  )
}
