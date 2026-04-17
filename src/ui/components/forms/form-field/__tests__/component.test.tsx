import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { FormField } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('FormField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the label and helper text', () => {
    const { getByText } = renderWithProviders(
      <FormField config={{ label: 'Email', helperText: 'We will not share this.', required: true }}>
        <Text>Child input</Text>
      </FormField>,
    )

    expect(getByText('Email *')).toBeTruthy()
    expect(getByText('We will not share this.')).toBeTruthy()
  })

  it('renders ref-backed text', () => {
    const { getByText } = renderWithProviders(
      <FormField config={{ label: { from: 'copy.label' }, helperText: { from: 'copy.helper' } }} />,
      { initialValues: { copy: { label: 'Name', helper: 'As shown on your ID.' } } },
    )

    expect(getByText('Name')).toBeTruthy()
    expect(getByText('As shown on your ID.')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <FormField
        config={{
          label: 'Email',
          slots: {
            label: { letterSpacing: 'wide' },
            helperText: { color: 'muted' },
          },
        }}
      >
        <Text>Child input</Text>
      </FormField>,
    )

    expect(toJSON()).toBeTruthy()
  })
})
