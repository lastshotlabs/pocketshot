import { describe, expect, it } from 'vitest'
import React from 'react'
import { act } from 'react-test-renderer'
import { Select } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
]

describe('Select', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Select config={{ id: 'status', options: OPTIONS }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders trigger and options sheet', () => {
    const result = renderWithProviders(<Select config={{ id: 'status', options: OPTIONS }} />)
    expect(result.getByTestId('status')).toBeTruthy()

    const trigger = result.instance.root.find(
      (node) => node.props.testID === 'status' && typeof node.props.onPress === 'function',
    )
    act(() => {
      trigger.props.onPress()
    })

    expect(result.getByText('Select an option')).toBeTruthy()
    expect(result.getByTestId('status-option-draft')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const result = renderWithProviders(
      <Select
        config={{
          id: 'status',
          options: OPTIONS,
          slots: {
            trigger: { borderRadius: 'lg' },
            sheet: { borderRadius: 'xl' },
            optionText: { color: 'primary' },
          },
        }}
      />,
    )

    const trigger = result.instance.root.find(
      (node) => node.props.testID === 'status' && typeof node.props.onPress === 'function',
    )
    act(() => {
      trigger.props.onPress()
    })

    expect(result.getByTestId('status-option-published')).toBeTruthy()
  })
})
