import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Slider } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Slider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <Slider
        config={{ id: 'vol', min: 0, max: 100, step: 1, showValue: true, defaultValue: 0 }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the label when provided', () => {
    const { getByText } = renderWithProviders(
      <Slider
        config={{
          id: 'vol',
          label: 'Volume',
          min: 0,
          max: 100,
          step: 1,
          showValue: true,
          defaultValue: 50,
        }}
      />,
    )
    expect(getByText('Volume')).toBeTruthy()
  })

  it('renders without a label when label is omitted', () => {
    const { toJSON } = renderWithProviders(
      <Slider
        config={{ id: 'vol', min: 0, max: 100, step: 1, showValue: false, defaultValue: 0 }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the current value display when showValue is true', () => {
    const { getByText } = renderWithProviders(
      <Slider
        config={{ id: 'vol', min: 0, max: 100, step: 1, showValue: true, defaultValue: 42 }}
      />,
    )
    expect(getByText('42')).toBeTruthy()
  })

  it('does not render a value display when showValue is false', () => {
    const { toJSON } = renderWithProviders(
      <Slider
        config={{ id: 'vol', min: 0, max: 100, step: 1, showValue: false, defaultValue: 42 }}
      />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('"42"')
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <Slider
        config={{
          id: 'vol',
          min: 0,
          max: 100,
          step: 1,
          showValue: true,
          defaultValue: 0,
          testID: 'slider-vol',
        }}
      />,
    )
    expect(getByTestId('slider-vol')).toBeTruthy()
  })

  it('resolves value from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <Slider
        config={{
          id: 'vol',
          min: 0,
          max: 100,
          step: 1,
          showValue: true,
          value: { from: 'sliderVal' },
        }}
      />,
      { initialValues: { sliderVal: 75 } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the resolved from-ref value in the display', () => {
    const { getByText } = renderWithProviders(
      <Slider
        config={{
          id: 'vol',
          min: 0,
          max: 100,
          step: 1,
          showValue: true,
          value: { from: 'sliderVal' },
        }}
      />,
      { initialValues: { sliderVal: 75 } },
    )
    expect(getByText('75')).toBeTruthy()
  })

  it('renders with custom min, max, and step', () => {
    const { getByText } = renderWithProviders(
      <Slider
        config={{
          id: 'rating',
          label: 'Rating',
          min: 1,
          max: 5,
          step: 0.5,
          showValue: true,
          defaultValue: 3,
        }}
      />,
    )
    expect(getByText('Rating')).toBeTruthy()
    expect(getByText('3')).toBeTruthy()
  })
})
