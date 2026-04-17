import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Switch } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Switch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <Switch config={{ id: 'notify', defaultValue: false, disabled: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the label when provided', () => {
    const { getByText } = renderWithProviders(
      <Switch
        config={{
          id: 'notify',
          label: 'Enable Notifications',
          defaultValue: false,
          disabled: false,
        }}
      />,
    )
    expect(getByText('Enable Notifications')).toBeTruthy()
  })

  it('renders without a label when label is omitted', () => {
    const { toJSON } = renderWithProviders(
      <Switch config={{ id: 'notify', defaultValue: false, disabled: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('has accessibilityRole of switch', () => {
    const { getByRole } = renderWithProviders(
      <Switch config={{ id: 'notify', label: 'Notify', defaultValue: false, disabled: false }} />,
    )
    expect(getByRole('switch')).toBeTruthy()
  })

  it('applies testID to the RNSwitch element', () => {
    const { getByTestId } = renderWithProviders(
      <Switch
        config={{ id: 'notify', defaultValue: false, disabled: false, testID: 'switch-notify' }}
      />,
    )
    expect(getByTestId('switch-notify')).toBeTruthy()
  })

  it('falls back to id as testID when testID is not set', () => {
    const { getByTestId } = renderWithProviders(
      <Switch config={{ id: 'notify-id', defaultValue: false, disabled: false }} />,
    )
    expect(getByTestId('notify-id')).toBeTruthy()
  })

  it('resolves value from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <Switch
        config={{
          id: 'notify',
          defaultValue: false,
          disabled: false,
          value: { from: 'notifyEnabled' },
        }}
      />,
      { initialValues: { notifyEnabled: true } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders in disabled state without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Switch config={{ id: 'notify', label: 'Notify', defaultValue: false, disabled: true }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with defaultValue true without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Switch config={{ id: 'notify', label: 'Notify', defaultValue: true, disabled: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Switch
        config={{
          id: 'notify',
          label: 'Notify',
          slots: {
            row: { paddingY: 'sm' },
            label: { letterSpacing: 'wide' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
