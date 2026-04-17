import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { BackButton } from '../component'
import { BackButtonSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('BackButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<BackButton config={BackButtonSchema.parse({})} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders default label text when parsed through schema', () => {
    const { getByText } = renderWithProviders(<BackButton config={BackButtonSchema.parse({})} />)
    expect(getByText('Back')).toBeTruthy()
  })

  it('renders custom label text', () => {
    const { getByText } = renderWithProviders(<BackButton config={{ label: 'Cancel' }} />)
    expect(getByText('Cancel')).toBeTruthy()
  })

  it('renders as a button', () => {
    const { getByRole } = renderWithProviders(<BackButton config={{}} />)
    expect(getByRole('button')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(<BackButton config={{ testID: 'back-btn' }} />)
    expect(getByTestId('back-btn')).toBeTruthy()
  })

  it('uses id as testID when testID is not explicitly set', () => {
    const { getByTestId } = renderWithProviders(<BackButton config={{ id: 'my-back' }} />)
    expect(getByTestId('my-back')).toBeTruthy()
  })

  it('falls back to default testID when neither testID nor id are set', () => {
    const { getByTestId } = renderWithProviders(<BackButton config={{}} />)
    expect(getByTestId('back-button')).toBeTruthy()
  })

  it('renders the back glyph', () => {
    const { getByText } = renderWithProviders(<BackButton config={{}} />)
    expect(getByText('<')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <BackButton
        config={{
          label: 'Back',
          slots: {
            button: { paddingY: 'sm' },
            icon: { color: 'primary' },
            label: { letterSpacing: 'wide' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
