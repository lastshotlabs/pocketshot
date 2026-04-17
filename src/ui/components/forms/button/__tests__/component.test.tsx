import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Button } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Button', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <Button config={{ label: 'Save', onPress: { type: 'set-value', target: 'button.save', value: true } }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders label text', () => {
    const { getByText } = renderWithProviders(
      <Button config={{ label: 'Save', onPress: { type: 'set-value', target: 'button.save', value: true } }} />,
    )
    expect(getByText('Save')).toBeTruthy()
  })

  it('renders icons and loading state without crashing', () => {
    expect(
      renderWithProviders(
        <Button
          config={{
            label: 'Save',
            iconLeft: 'Left',
            iconRight: 'Right',
            onPress: { type: 'set-value', target: 'button.save', value: true },
          }}
        />,
      ).toJSON(),
    ).toBeTruthy()

    expect(
      renderWithProviders(
        <Button
          config={{
            label: 'Saving',
            loading: true,
            onPress: { type: 'set-value', target: 'button.save', value: true },
          }}
        />,
      ).toJSON(),
    ).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Button
        config={{
          label: 'Save',
          onPress: { type: 'set-value', target: 'button.save', value: true },
          slots: {
            button: { paddingY: 'sm' },
            label: { letterSpacing: 'wide' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
