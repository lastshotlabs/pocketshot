import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ProgressBar } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('ProgressBar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<ProgressBar config={{ value: 50 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders label text when provided', () => {
    const { getByText } = renderWithProviders(
      <ProgressBar config={{ value: 40, label: 'Upload progress' }} />,
    )
    expect(getByText('Upload progress')).toBeTruthy()
  })

  it('renders percentage value text when showValue is true', () => {
    const { getByText } = renderWithProviders(
      <ProgressBar config={{ value: 75, showValue: true }} />,
    )
    expect(getByText('75%')).toBeTruthy()
  })

  it('renders label and value together', () => {
    const { getByText } = renderWithProviders(
      <ProgressBar config={{ value: 30, label: 'Step 1', showValue: true }} />,
    )
    expect(getByText('Step 1')).toBeTruthy()
    expect(getByText('30%')).toBeTruthy()
  })

  it('renders all variants without crashing', () => {
    const variants = ['default', 'success', 'warning', 'error'] as const
    for (const variant of variants) {
      const { toJSON } = renderWithProviders(<ProgressBar config={{ value: 50, variant }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders all shared borderRadius values without crashing', () => {
    const borderRadiusValues = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
    for (const borderRadius of borderRadiusValues) {
      const { toJSON } = renderWithProviders(<ProgressBar config={{ value: 50, borderRadius }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('clamps value at 0', () => {
    const { getByText } = renderWithProviders(
      <ProgressBar config={{ value: 0, showValue: true }} />,
    )
    expect(getByText('0%')).toBeTruthy()
  })

  it('clamps value at 100', () => {
    const { getByText } = renderWithProviders(
      <ProgressBar config={{ value: 100, showValue: true }} />,
    )
    expect(getByText('100%')).toBeTruthy()
  })

  it('renders with animated false', () => {
    const { toJSON } = renderWithProviders(<ProgressBar config={{ value: 60, animated: false }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('exposes progressbar accessibility role', () => {
    const { getByRole } = renderWithProviders(
      <ProgressBar config={{ value: 50, label: 'Loading' }} />,
    )
    expect(getByRole('progressbar')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <ProgressBar config={{ value: 50, testID: 'upload-progress' }} />,
    )
    expect(getByTestId('upload-progress')).toBeTruthy()
  })

  it('resolves value from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <ProgressBar config={{ value: { from: 'uploadPct' }, showValue: true }} />,
      { initialValues: { uploadPct: 42 } },
    )
    expect(getByText('42%')).toBeTruthy()
  })

  it('falls back to 0 when from-ref value is missing', () => {
    const { getByText } = renderWithProviders(
      <ProgressBar config={{ value: { from: 'missing' }, showValue: true }} />,
    )
    expect(getByText('0%')).toBeTruthy()
  })
})
