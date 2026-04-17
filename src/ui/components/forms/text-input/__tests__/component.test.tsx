import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { TextInput } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('TextInput', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'name',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the label when provided', () => {
    const { getByText } = renderWithProviders(
      <TextInput
        config={{
          id: 'name',
          label: 'Full Name',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
        }}
      />,
    )
    expect(getByText('Full Name')).toBeTruthy()
  })

  it('renders without a label when label is omitted', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'name',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders helper text when provided and no error', () => {
    const { getByText } = renderWithProviders(
      <TextInput
        config={{
          id: 'name',
          helperText: 'Enter your full name',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
        }}
      />,
    )
    expect(getByText('Enter your full name')).toBeTruthy()
  })

  it('renders a static error text when errorText is a string', () => {
    const { getByText } = renderWithProviders(
      <TextInput
        config={{
          id: 'name',
          errorText: 'Name is required',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
        }}
      />,
    )
    expect(getByText('Name is required')).toBeTruthy()
  })

  it('resolves errorText from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <TextInput
        config={{
          id: 'email',
          label: 'Email',
          errorText: { from: 'emailError' },
          secureTextEntry: false,
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          multiline: false,
        }}
      />,
      { initialValues: { emailError: 'Invalid email address' } },
    )
    expect(getByText('Invalid email address')).toBeTruthy()
  })

  it('error text takes precedence over helper text', () => {
    const { getByText, toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'email',
          helperText: 'Your email',
          errorText: 'Required',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'none',
          multiline: false,
        }}
      />,
    )
    expect(getByText('Required')).toBeTruthy()
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Your email')
  })

  it('applies testID to the input element using the testID prefix', () => {
    const { getByTestId } = renderWithProviders(
      <TextInput
        config={{
          id: 'name',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
          testID: 'input-name',
        }}
      />,
    )
    expect(getByTestId('input-name-input')).toBeTruthy()
  })

  it('uses id to build testID when testID is not set', () => {
    const { getByTestId } = renderWithProviders(
      <TextInput
        config={{
          id: 'name-id',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
        }}
      />,
    )
    expect(getByTestId('name-id-input')).toBeTruthy()
  })

  it('resolves value from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'name',
          value: { from: 'nameValue' },
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: false,
        }}
      />,
      { initialValues: { nameValue: 'John Doe' } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders email keyboard type without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'email',
          label: 'Email',
          keyboardType: 'email-address',
          secureTextEntry: false,
          autoCapitalize: 'none',
          multiline: false,
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders numeric keyboard type without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'phone',
          label: 'Phone',
          keyboardType: 'numeric',
          secureTextEntry: false,
          autoCapitalize: 'none',
          multiline: false,
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders secureTextEntry without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'pass',
          label: 'Password',
          secureTextEntry: true,
          keyboardType: 'default',
          autoCapitalize: 'none',
          multiline: false,
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders multiline mode without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'bio',
          label: 'Bio',
          secureTextEntry: false,
          keyboardType: 'default',
          autoCapitalize: 'sentences',
          multiline: true,
          numberOfLines: 4,
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TextInput
        config={{
          id: 'email',
          slots: {
            input: { borderRadius: 'lg' },
            label: { letterSpacing: 'wide' },
            errorText: { color: 'error' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
