import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Select } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
]

describe('Select', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <Select config={{ id: 'fruit', options: OPTIONS, placeholder: 'Select an option' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the placeholder when no value is selected', () => {
    const { getByText } = renderWithProviders(
      <Select config={{ id: 'fruit', options: OPTIONS, placeholder: 'Pick a fruit' }} />,
    )
    expect(getByText('Pick a fruit')).toBeTruthy()
  })

  it('renders the label when provided', () => {
    const { getByText } = renderWithProviders(
      <Select
        config={{
          id: 'fruit',
          label: 'Favourite Fruit',
          options: OPTIONS,
          placeholder: 'Select an option',
        }}
      />,
    )
    expect(getByText('Favourite Fruit')).toBeTruthy()
  })

  it('renders without a label when label is omitted', () => {
    const { toJSON } = renderWithProviders(
      <Select config={{ id: 'fruit', options: OPTIONS, placeholder: 'Select an option' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('has accessibilityRole of button on the trigger', () => {
    const { getByRole } = renderWithProviders(
      <Select config={{ id: 'fruit', options: OPTIONS, placeholder: 'Select an option' }} />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('applies testID to the trigger', () => {
    const { getByTestId } = renderWithProviders(
      <Select
        config={{
          id: 'fruit',
          options: OPTIONS,
          placeholder: 'Select an option',
          testID: 'select-fruit',
        }}
      />,
    )
    expect(getByTestId('select-fruit')).toBeTruthy()
  })

  it('falls back to id as testID when testID is not set', () => {
    const { getByTestId } = renderWithProviders(
      <Select config={{ id: 'fruit-id', options: OPTIONS, placeholder: 'Select an option' }} />,
    )
    expect(getByTestId('fruit-id')).toBeTruthy()
  })

  it('resolves options from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <Select
        config={{ id: 'fruit', options: { from: 'fruitOptions' }, placeholder: 'Select an option' }}
      />,
      { initialValues: { fruitOptions: OPTIONS } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('resolves value from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <Select
        config={{
          id: 'fruit',
          options: OPTIONS,
          placeholder: 'Select an option',
          value: { from: 'selectedFruit' },
        }}
      />,
      { initialValues: { selectedFruit: 'banana' } },
    )
    // When value resolves to 'banana', the selected label 'Banana' should display
    expect(getByText('Banana')).toBeTruthy()
  })

  it('displays the selected option label when a static value is provided', () => {
    const { getByText } = renderWithProviders(
      <Select
        config={{ id: 'fruit', options: OPTIONS, placeholder: 'Select an option', value: 'cherry' }}
      />,
    )
    expect(getByText('Cherry')).toBeTruthy()
  })
})
