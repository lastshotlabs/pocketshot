import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ToastBase, type ToastPosition, type ToastVariant } from './standalone'
import type { ToastConfig, ToastPayload } from './types'

export function Toast({ config }: { config: ToastConfig }) {
  const { getValue } = useScreenContext()
  const toastPayload = getValue('__toast') as ToastPayload | undefined
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null)
  const lastIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!toastPayload || toastPayload.id === lastIdRef.current) return
    lastIdRef.current = toastPayload.id
    setActiveToast(toastPayload)
  }, [toastPayload])

  const handleDismiss = useCallback(() => {
    setActiveToast(null)
  }, [])

  if (!activeToast) return null

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={['open']}
    >
      <ToastBase
        id={config.id}
        testID={config.testID}
        visible
        message={activeToast.message}
        variant={activeToast.variant as ToastVariant}
        position={config.position as ToastPosition}
        duration={activeToast.duration}
        onDismiss={handleDismiss}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
