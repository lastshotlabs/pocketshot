import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { QrScannerBase } from './standalone'
import type { QrScannerConfig } from './types'

export function QrScanner({ config }: { config: QrScannerConfig }) {
  const { dispatch, values } = useScreenContext()

  const overlayText =
    config.overlayText != null
      ? String(resolveFromRef(config.overlayText, values) ?? '')
      : undefined

  const handleScan = (value: string) => {
    if (config.id != null) {
      void dispatch({ type: 'set-value', target: config.id, value })
    }
    void dispatch(config.onScan)
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <QrScannerBase
        onScan={handleScan}
        torchEnabled={config.torchEnabled}
        showOverlay={config.showOverlay}
        overlayText={overlayText}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
