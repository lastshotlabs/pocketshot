import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { Chart } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const SAMPLE_DATA = [
  { label: 'Q1', value: 10 },
  { label: 'Q2', value: 15 },
  { label: 'Q3', value: 8 },
]

describe('Chart', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<Chart config={{ data: SAMPLE_DATA }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders title when provided', () => {
    const { getByText } = renderWithProviders(
      <Chart config={{ data: SAMPLE_DATA, title: 'Quarterly revenue' }} />,
    )

    expect(getByText('Quarterly revenue')).toBeTruthy()
  })

  it('renders line, donut, and pie variants without crashing', () => {
    for (const type of ['line', 'donut', 'pie'] as const) {
      const { toJSON } = renderWithProviders(<Chart config={{ data: SAMPLE_DATA, type }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders legend when enabled', () => {
    const { getByRole } = renderWithProviders(
      <Chart config={{ data: SAMPLE_DATA, showLegend: true }} />,
    )

    expect(getByRole('list')).toBeTruthy()
  })

  it('renders with chart slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Chart
        config={{
          data: SAMPLE_DATA,
          showLegend: true,
          showValues: true,
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
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('resolves data from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <Chart config={{ data: { from: 'chart.data' }, showLegend: true }} />,
      { initialValues: { chart: { data: SAMPLE_DATA } } },
    )

    expect(toJSON()).toBeTruthy()
  })
})
