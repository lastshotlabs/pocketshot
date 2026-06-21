import React, { useCallback, type ReactNode } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ModalBase, type ModalSize } from './standalone'
import type { ModalConfig } from './types'

export interface ModalProps {
  config: ModalConfig
  children?: ReactNode
}

export function Modal({ config, children }: ModalProps) {
  const { getValue, setValue } = useScreenContext()
  const isOpen = Boolean(getValue(`__modal_${config.id}`))

  const handleClose = useCallback(() => {
    setValue(`__modal_${config.id}`, false)
  }, [config.id, setValue])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <ModalBase
        id={config.id}
        testID={config.testID}
        visible={isOpen}
        onClose={handleClose}
        title={config.title}
        size={(config.size ?? 'md') as ModalSize}
        showCloseButton={config.showCloseButton ?? true}
        closeOnBackdrop={config.closeOnBackdrop}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </ModalBase>
    </ComponentWrapper>
  )
}
