import { describe, expect, it } from 'vitest'
import { QrScannerSchema } from '../schema'

describe('QrScannerSchema', () => {
  it('parses the required scan action', () => {
    const result = QrScannerSchema.parse({
      onScan: { type: 'set-value', target: 'scan.value', value: true },
    })

    expect(result.onScan).toEqual({ type: 'set-value', target: 'scan.value', value: true })
  })

  it('accepts ref-backed overlay text', () => {
    const result = QrScannerSchema.parse({
      onScan: { type: 'set-value', target: 'scan.value', value: true },
      overlayText: { from: 'copy.overlay' },
    })

    expect(result.overlayText).toEqual({ from: 'copy.overlay' })
  })

  it('applies defaults', () => {
    const result = QrScannerSchema.parse({
      onScan: { type: 'set-value', target: 'scan.value', value: true },
    })

    expect(result.torchEnabled).toBe(false)
    expect(result.showOverlay).toBe(true)
  })

  it('accepts slot styling surfaces', () => {
    const result = QrScannerSchema.parse({
      onScan: { type: 'set-value', target: 'scan.value', value: true },
      slots: {
        fallback: { borderRadius: 'xl' },
        overlayText: { color: 'primary' },
        permissionButton: { borderRadius: 'md' },
      },
    })

    expect(result.slots?.fallback?.borderRadius).toBe('xl')
    expect(result.slots?.overlayText?.color).toBe('primary')
    expect(result.slots?.permissionButton?.borderRadius).toBe('md')
  })
})
