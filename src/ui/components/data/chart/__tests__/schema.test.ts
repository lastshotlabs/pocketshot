import { describe, expect, it } from 'vitest'
import { ChartSchema } from '../schema'

describe('ChartSchema', () => {
  it('parses a minimal valid config', () => {
    const result = ChartSchema.parse({
      data: [{ label: 'Q1', value: 10 }],
    })

    expect(result.type).toBe('bar')
  })

  it('accepts from-ref data', () => {
    const result = ChartSchema.parse({
      data: { from: 'chart.data' },
      type: 'line',
    })

    expect(result.data).toEqual({ from: 'chart.data' })
  })

  it('accepts chart slot surfaces', () => {
    const result = ChartSchema.parse({
      data: [{ label: 'Q1', value: 10 }],
      showLegend: true,
      slots: {
        legend: {
          paddingY: 'sm',
        },
        legendItem: {
          paddingX: 'xs',
        },
        series: {
          opacity: 0.9,
        },
        axis: {
          color: 'muted',
        },
      },
    })

    expect(result.slots?.legend).toMatchObject({ paddingY: 'sm' })
    expect(result.slots?.series).toMatchObject({ opacity: 0.9 })
  })
})
