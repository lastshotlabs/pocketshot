import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Badge } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Badge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders label text', () => {
    const { getByText } = renderWithProviders(
      <Badge config={{ label: 'Test', variant: 'default', size: 'md' }} />,
    )
    expect(getByText('Test')).toBeTruthy()
  })

  it('renders all variants without crashing', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const
    for (const variant of variants) {
      const { getByText } = renderWithProviders(
        <Badge config={{ label: variant, variant, size: 'md' }} />,
      )
      expect(getByText(variant)).toBeTruthy()
    }
  })

  it('renders all sizes without crashing', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { getByText } = renderWithProviders(
        <Badge config={{ label: size, variant: 'primary', size }} />,
      )
      expect(getByText(size)).toBeTruthy()
    }
  })

  it('applies testID', () => {
    const { getByTestId } = renderWithProviders(
      <Badge config={{ label: 'X', variant: 'default', size: 'md', testID: 'badge-x' }} />,
    )
    expect(getByTestId('badge-x')).toBeTruthy()
  })

  it('resolves label from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <Badge config={{ label: { from: 'status' }, variant: 'default', size: 'md' }} />,
      { initialValues: { status: 'Active' } },
    )
    expect(getByText('Active')).toBeTruthy()
  })

  it('renders a pressable button when onPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <Badge
        config={{
          label: 'Pressable',
          variant: 'primary',
          size: 'md',
          onPress: { type: 'toast', message: 'hi' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('accepts shared text styling props and slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Badge
        config={{
          label: 'Styled',
          color: 'primary',
          fontSize: 'lg',
          slots: {
            root: { paddingX: 'lg' },
            label: { letterSpacing: 'wide' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
