import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Checkbox } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Checkbox', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <Checkbox
        config={{ id: 'agree', label: 'I agree', defaultChecked: false, disabled: false }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the label text', () => {
    const { getByText } = renderWithProviders(
      <Checkbox
        config={{ id: 'agree', label: 'Accept Terms', defaultChecked: false, disabled: false }}
      />,
    )
    expect(getByText('Accept Terms')).toBeTruthy()
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <Checkbox
        config={{
          id: 'agree',
          label: 'Accept',
          defaultChecked: false,
          disabled: false,
          testID: 'checkbox-agree',
        }}
      />,
    )
    expect(getByTestId('checkbox-agree')).toBeTruthy()
  })

  it('falls back to id as testID when testID is not set', () => {
    const { getByTestId } = renderWithProviders(
      <Checkbox
        config={{ id: 'agree-id', label: 'Accept', defaultChecked: false, disabled: false }}
      />,
    )
    expect(getByTestId('agree-id')).toBeTruthy()
  })

  it('has accessibilityRole of checkbox', () => {
    const { getByRole } = renderWithProviders(
      <Checkbox
        config={{ id: 'agree', label: 'Accept', defaultChecked: false, disabled: false }}
      />,
    )
    expect(getByRole('checkbox')).toBeTruthy()
  })

  it('resolves checked value from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <Checkbox
        config={{
          id: 'agree',
          label: 'Accept',
          defaultChecked: false,
          disabled: false,
          checked: { from: 'isChecked' },
        }}
      />,
      { initialValues: { isChecked: true } },
    )
    // Renders without crashing with a from-ref checked value
    expect(toJSON()).toBeTruthy()
  })

  it('renders in disabled state without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Checkbox config={{ id: 'agree', label: 'Accept', defaultChecked: false, disabled: true }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with defaultChecked true without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Checkbox config={{ id: 'agree', label: 'Accept', defaultChecked: true, disabled: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
