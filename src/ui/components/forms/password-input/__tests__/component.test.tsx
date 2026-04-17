import { describe, expect, it } from 'vitest'
import React from 'react'
import { PasswordInput } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('PasswordInput', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<PasswordInput config={{ id: 'password' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders input and toggle button', () => {
    const result = renderWithProviders(<PasswordInput config={{ id: 'password' }} />)
    expect(result.getByTestId('password-input')).toBeTruthy()
    expect(result.getByTestId('password-toggle')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <PasswordInput
        config={{
          id: 'password',
          slots: {
            inputRow: { borderRadius: 'lg' },
            toggleText: { color: 'primary' },
            helperText: { color: 'muted' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
