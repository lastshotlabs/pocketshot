import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Textarea } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Textarea', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Textarea config={{ id: 'bio' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders label, helper, and error text', () => {
    expect(
      renderWithProviders(
        <Textarea config={{ id: 'bio', label: 'Bio', helperText: 'Add details' }} />,
      ).getByText('Bio'),
    ).toBeTruthy()

    expect(
      renderWithProviders(<Textarea config={{ id: 'bio', helperText: 'Add details' }} />).getByText(
        'Add details',
      ),
    ).toBeTruthy()

    expect(
      renderWithProviders(<Textarea config={{ id: 'bio', errorText: 'Required' }} />).getByText(
        'Required',
      ),
    ).toBeTruthy()
  })

  it('renders char count when configured', () => {
    const { getByText } = renderWithProviders(
      <Textarea
        config={{ id: 'bio', maxLength: 140, showCharCount: true, defaultValue: 'Hello' }}
      />,
    )
    expect(getByText('5/140')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Textarea
        config={{
          id: 'bio',
          slots: {
            inputWrapper: { borderRadius: 'lg' },
            label: { letterSpacing: 'wide' },
            charCount: { color: 'muted' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
