import { describe, expect, it } from 'vitest'
import { QrCodeSchema } from '../schema'

describe('QrCodeSchema', () => {
  it('parses string value', () => {
    const result = QrCodeSchema.parse({ value: 'https://example.com' })
    expect(result.value).toBe('https://example.com')
  })

  it('parses from-ref value', () => {
    const result = QrCodeSchema.parse({ value: { from: 'links.share' } })
    expect(result.value).toEqual({ from: 'links.share' })
  })

  it('applies defaults', () => {
    const result = QrCodeSchema.parse({ value: 'https://example.com' })
    expect(result.size).toBe(200)
    expect(result.errorCorrectionLevel).toBe('M')
  })

  it('accepts shared color and background surfaces', () => {
    const result = QrCodeSchema.parse({
      value: 'https://example.com',
      color: 'primary',
      bg: 'card',
    })

    expect(result.color).toBe('primary')
    expect(result.bg).toBe('card')
  })

  it('accepts slot styling surfaces', () => {
    const result = QrCodeSchema.parse({
      value: 'https://example.com',
      slots: {
        container: { borderRadius: 'xl' },
        caption: { color: 'primary' },
      },
    })

    expect(result.slots?.container?.borderRadius).toBe('xl')
    expect(result.slots?.caption?.color).toBe('primary')
  })
})
