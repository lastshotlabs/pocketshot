import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { SaveIndicator } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('SaveIndicator', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the saving label', () => {
    const { getByText } = renderWithProviders(
      <SaveIndicator config={{ status: 'saving', savingLabel: 'Saving' }} />,
    )
    expect(getByText('Saving')).toBeTruthy()
  })

  it('resolves status from screen context', () => {
    const { getByText } = renderWithProviders(
      <SaveIndicator config={{ status: { from: 'draft.state' } }} />,
      { initialValues: { draft: { state: 'saved' } } },
    )
    expect(getByText('Saved')).toBeTruthy()
  })

  it('accepts shared text styling props and slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <SaveIndicator
        config={{
          status: 'error',
          color: 'error',
          fontSize: 'lg',
          slots: {
            label: { letterSpacing: 'wide' },
            icon: { color: 'warning' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
