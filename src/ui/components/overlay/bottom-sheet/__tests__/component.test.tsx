import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { BottomSheet } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('BottomSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'sheet-a', snapPoints: ['50%'] }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders without crashing when open via context', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'info-sheet', snapPoints: ['60%'] }} />,
      { initialValues: { '__sheet_info-sheet': true } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders title with accessibilityRole header', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'hdr-sheet', snapPoints: ['50%'], title: 'Accessible Header' }} />,
      { initialValues: { '__sheet_hdr-sheet': true } },
    )
    const json = JSON.stringify(toJSON())
    expect(json).toContain('"header"')
    expect(json).toContain('Accessible Header')
  })

  it('renders children when open', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'child-sheet', snapPoints: ['50%'] }}>
        <Text>Sheet Content</Text>
      </BottomSheet>,
      { initialValues: { '__sheet_child-sheet': true } },
    )
    expect(JSON.stringify(toJSON())).toContain('Sheet Content')
  })

  it('renders backdrop label when open', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'backdrop-sheet', snapPoints: ['50%'], closeOnBackdrop: true }} />,
      { initialValues: { '__sheet_backdrop-sheet': true } },
    )
    const json = JSON.stringify(toJSON())
    expect(json).toContain('Close sheet')
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet
        config={{
          id: 'slot-sheet',
          snapPoints: ['50%'],
          title: 'Styled',
          slots: {
            panel: { bg: 'card' },
            title: { letterSpacing: 'wide' },
            content: { paddingY: 'lg' },
          },
        }}
      >
        <Text>Body</Text>
      </BottomSheet>,
      { initialValues: { '__sheet_slot-sheet': true } },
    )
    expect(toJSON()).toBeTruthy()
  })
})
