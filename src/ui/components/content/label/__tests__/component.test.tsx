import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Label } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Label', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Label config={{ text: 'Status' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders text content', () => {
    const { getByText } = renderWithProviders(<Label config={{ text: 'Category' }} />)
    expect(getByText('Category')).toBeTruthy()
  })

  it('renders all variant options without crashing', () => {
    for (const variant of ['default', 'muted', 'error', 'success'] as const) {
      const { getByText } = renderWithProviders(<Label config={{ text: variant, variant }} />)
      expect(getByText(variant)).toBeTruthy()
    }
  })

  it('renders all size variants without crashing', () => {
    for (const size of ['xs', 'sm', 'md'] as const) {
      const { getByText } = renderWithProviders(<Label config={{ text: size, size }} />)
      expect(getByText(size)).toBeTruthy()
    }
  })

  it('renders uppercase text when uppercase is true', () => {
    const { getByText } = renderWithProviders(
      <Label config={{ text: 'pending', uppercase: true }} />,
    )
    expect(getByText('PENDING')).toBeTruthy()
  })

  it('renders original case when uppercase is false', () => {
    const { getByText } = renderWithProviders(
      <Label config={{ text: 'pending', uppercase: false }} />,
    )
    expect(getByText('pending')).toBeTruthy()
  })

  it('has accessibilityRole of text', () => {
    const { getByRole } = renderWithProviders(<Label config={{ text: 'Accessible' }} />)
    expect(getByRole('text')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Label config={{ text: 'Tagged', testID: 'label-status' }} />,
    )
    expect(getByTestId('label-status')).toBeTruthy()
  })

  it('resolves text from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <Label config={{ text: { from: 'statusLabel' } }} />,
      { initialValues: { statusLabel: 'Active' } },
    )
    expect(getByText('Active')).toBeTruthy()
  })

  it('applies uppercase to from-ref resolved text', () => {
    const { getByText } = renderWithProviders(
      <Label config={{ text: { from: 'role' }, uppercase: true }} />,
      { initialValues: { role: 'admin' } },
    )
    expect(getByText('ADMIN')).toBeTruthy()
  })
})
