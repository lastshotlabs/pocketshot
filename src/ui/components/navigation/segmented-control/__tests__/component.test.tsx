import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { SegmentedControl } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const baseOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
]

describe('SegmentedControl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <SegmentedControl config={{ id: 'sc', options: baseOptions }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders all segment labels', () => {
    const { getByText } = renderWithProviders(
      <SegmentedControl config={{ id: 'sc', options: baseOptions }} />,
    )
    expect(getByText('All')).toBeTruthy()
    expect(getByText('Active')).toBeTruthy()
    expect(getByText('Closed')).toBeTruthy()
  })

  it('renders with two options', () => {
    const options = [
      { label: 'Map', value: 'map' },
      { label: 'List', value: 'list' },
    ]
    const { getByText } = renderWithProviders(
      <SegmentedControl config={{ id: 'view-toggle', options }} />,
    )
    expect(getByText('Map')).toBeTruthy()
    expect(getByText('List')).toBeTruthy()
  })

  it('applies testID prefix to each segment', () => {
    const { getByTestId } = renderWithProviders(
      <SegmentedControl config={{ id: 'sc', options: baseOptions, testID: 'filter' }} />,
    )
    expect(getByTestId('filter-all')).toBeTruthy()
    expect(getByTestId('filter-active')).toBeTruthy()
    expect(getByTestId('filter-closed')).toBeTruthy()
  })

  it('uses id-based testID when testID is not provided', () => {
    const { getByTestId } = renderWithProviders(
      <SegmentedControl config={{ id: 'sc', options: baseOptions }} />,
    )
    expect(getByTestId('sc-segment-0')).toBeTruthy()
    expect(getByTestId('sc-segment-1')).toBeTruthy()
    expect(getByTestId('sc-segment-2')).toBeTruthy()
  })

  it('applies wrapper testID when testID is set', () => {
    const { getByTestId } = renderWithProviders(
      <SegmentedControl config={{ id: 'sc', options: baseOptions, testID: 'filter-tabs' }} />,
    )
    expect(getByTestId('filter-tabs')).toBeTruthy()
  })

  it('selects the first option by default when no defaultValue is set', () => {
    const { getByTestId } = renderWithProviders(
      <SegmentedControl config={{ id: 'sc', options: baseOptions, testID: 'sc' }} />,
    )
    const firstSegment = getByTestId('sc-all')
    expect(firstSegment).toBeTruthy()
    // The first option's accessibilityState should indicate selected=true
    expect((firstSegment as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('applies defaultValue as the initially selected segment', () => {
    const { getByTestId } = renderWithProviders(
      <SegmentedControl
        config={{ id: 'sc', options: baseOptions, defaultValue: 'active', testID: 'sc' }}
      />,
    )
    const activeSegment = getByTestId('sc-active')
    expect((activeSegment as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('resolves value from screen context via from-ref', () => {
    const { getByTestId } = renderWithProviders(
      <SegmentedControl
        config={{ id: 'sc', options: baseOptions, value: { from: 'filter' }, testID: 'sc' }}
      />,
      { initialValues: { filter: 'closed' } },
    )
    const closedSegment = getByTestId('sc-closed')
    expect((closedSegment as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('marks non-active segments as not selected', () => {
    const { getByTestId } = renderWithProviders(
      <SegmentedControl
        config={{ id: 'sc', options: baseOptions, defaultValue: 'all', testID: 'sc' }}
      />,
    )
    const activeSegment = getByTestId('sc-active')
    expect((activeSegment as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: false,
    })
  })
})
