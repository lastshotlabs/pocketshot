import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { EntityPicker } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const OPTIONS = [
  { value: '1', label: 'Alice Adams', subtitle: 'Design' },
  { value: '2', label: 'Bob Brown', subtitle: 'Engineering' },
]
const ON_CHANGE = { type: 'set-value' as const, target: 'picker.meta', value: 'changed' }

describe('EntityPicker', () => {
  it('renders placeholder when nothing is selected', () => {
    const { getByText } = renderWithProviders(
      <EntityPicker config={{ id: 'assignee', data: OPTIONS, testID: 'assignee' }} />,
    )

    expect(getByText('Select...')).toBeTruthy()
  })

  it('opens, selects an entity, and updates the trigger label', () => {
    const result = renderWithProviders(
      <EntityPicker
        config={{ id: 'assignee', data: OPTIONS, onChangeAction: ON_CHANGE, testID: 'assignee' }}
      />,
    )

    const trigger = result.instance.root.find(
      (node) => node.props.testID === 'assignee' && typeof node.props.onPress === 'function',
    )
    act(() => {
      trigger.props.onPress()
    })

    const aliceOption = result.instance.root.find(
      (node) => node.props.testID === 'entity-option-1' && typeof node.props.onPress === 'function',
    )
    act(() => {
      aliceOption.props.onPress()
    })

    expect(result.getByText('Alice Adams')).toBeTruthy()
  })

  it('hydrates selected values and slot surfaces', () => {
    const { getByText, getByTestId, toJSON } = renderWithProviders(
      <EntityPicker
        config={{
          id: 'assignee',
          data: { from: 'people.options' },
          value: { from: 'people.selected' },
          testID: 'assignee',
          slots: {
            trigger: {
              paddingY: 'sm',
            },
            entityLabel: {
              letterSpacing: 'wide',
            },
            emptyText: {
              color: 'muted',
            },
          },
        }}
      />,
      {
        initialValues: {
          people: {
            options: OPTIONS,
            selected: '2',
          },
        },
      },
    )

    expect(toJSON()).toBeTruthy()
    expect(getByText('Bob Brown')).toBeTruthy()
    expect(getByTestId('assignee-clear')).toBeTruthy()
  })
})
