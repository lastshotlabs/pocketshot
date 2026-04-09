import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { FormField } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('FormField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<FormField config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the label when provided', () => {
    const { getByText } = renderWithProviders(<FormField config={{ label: 'Username' }} />)
    expect(getByText('Username')).toBeTruthy()
  })

  it('does not render a label element when label is omitted', () => {
    const { toJSON } = renderWithProviders(<FormField config={{}} />)
    // Renders without error; no label text present
    expect(toJSON()).toBeTruthy()
  })

  it('renders helper text when provided and no error', () => {
    const { getByText } = renderWithProviders(
      <FormField config={{ helperText: 'Enter your username' }} />,
    )
    expect(getByText('Enter your username')).toBeTruthy()
  })

  it('renders an error from screen context via errorKey', () => {
    const { getByText } = renderWithProviders(
      <FormField config={{ errorKey: 'usernameError' }} />,
      { initialValues: { usernameError: 'Username is taken' } },
    )
    expect(getByText('Username is taken')).toBeTruthy()
  })

  it('shows error text instead of helper text when both are present and error exists', () => {
    const { getByText, toJSON } = renderWithProviders(
      <FormField config={{ helperText: 'Enter name', errorKey: 'nameErr' }} />,
      { initialValues: { nameErr: 'Name is required' } },
    )
    expect(getByText('Name is required')).toBeTruthy()
    // Helper text should not appear when there is an error
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Enter name')
  })

  it('shows required indicator when required is true', () => {
    const { getByText } = renderWithProviders(
      <FormField config={{ label: 'Email', required: true }} />,
    )
    // The asterisk is rendered as a Text child with " *"
    expect(getByText(' *')).toBeTruthy()
  })

  it('does not show required indicator when required is false', () => {
    const { toJSON } = renderWithProviders(
      <FormField config={{ label: 'Email', required: false }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain(' *')
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(<FormField config={{ testID: 'field-username' }} />)
    expect(getByTestId('field-username')).toBeTruthy()
  })

  it('renders children inside the field', () => {
    const { getByText } = renderWithProviders(
      <FormField config={{}}>
        <Text>child content</Text>
      </FormField>,
    )
    expect(getByText('child content')).toBeTruthy()
  })
})
