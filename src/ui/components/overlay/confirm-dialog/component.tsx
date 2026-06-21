import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ConfirmDialogBase, type ConfirmDialogVariant } from './standalone'
import type { ConfirmDialogConfig } from './types'

export function ConfirmDialog({ config }: { config: ConfirmDialogConfig }) {
  const { getValue, setValue, dispatch } = useScreenContext()
  const isOpen = Boolean(getValue(`__confirm_${config.id}`))

  const handleClose = useCallback(() => {
    setValue(`__confirm_${config.id}`, false)
  }, [config.id, setValue])

  const handleConfirm = useCallback(() => {
    void dispatch(config.onConfirm)
  }, [config.onConfirm, dispatch])

  const handleCancel = useCallback(() => {
    if (config.onCancel) void dispatch(config.onCancel)
  }, [config.onCancel, dispatch])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <ConfirmDialogBase
        id={config.id}
        testID={config.testID}
        visible={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        onCancel={config.onCancel ? handleCancel : undefined}
        title={config.title}
        message={config.message}
        confirmLabel={config.confirmLabel}
        cancelLabel={config.cancelLabel}
        variant={config.variant as ConfirmDialogVariant | undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
