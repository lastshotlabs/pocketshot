import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { BottomSheet } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

// @gorhom/bottom-sheet is not installed — tryGorhom() returns null naturally.
// The custom Animated + PanResponder fallback is exercised in all tests below.

describe('BottomSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Crash-safety ────────────────────────────────────────────────────────────

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'sheet-a', snapPoints: ['50%'] }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders without crashing when closed (default state — no context value set)', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'sheet-b', snapPoints: ['40%'] }} />,
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

  it('renders with multiple snap points without crashing', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'multi-snap', snapPoints: ['25%', '50%', '90%'] }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with absolute pixel snap points without crashing', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'pixel-snap', snapPoints: ['300'] }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with showHandle=false without crashing', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'nohandle-sheet', snapPoints: ['50%'], showHandle: false }} />,
      { initialValues: { '__sheet_nohandle-sheet': true } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with showHandle=true without crashing', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'handle-sheet', snapPoints: ['50%'], showHandle: true }} />,
      { initialValues: { '__sheet_handle-sheet': true } },
    )
    expect(toJSON()).toBeTruthy()
  })

  // ── Title rendering ─────────────────────────────────────────────────────────
  // Note: toJSON() returns an array (Fragment root) because CustomBottomSheet
  // renders two sibling elements (backdrop + sheet panel). getByText/getByRole
  // cannot traverse array roots, so text presence is verified via JSON.stringify.

  it('renders the title text when config.title is provided', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'titled-sheet', snapPoints: ['50%'], title: 'Sheet Title' }} />,
      { initialValues: { '__sheet_titled-sheet': true } },
    )
    expect(JSON.stringify(toJSON())).toContain('Sheet Title')
  })

  it('does not render a title text node when config.title is not set', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'notitle-sheet', snapPoints: ['50%'] }} />,
      { initialValues: { '__sheet_notitle-sheet': true } },
    )
    // No title text, no header role
    expect(JSON.stringify(toJSON())).not.toContain('"header"')
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

  // ── Children rendering ──────────────────────────────────────────────────────

  it('renders children when open', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'child-sheet', snapPoints: ['50%'] }}>
        <Text>Sheet Content</Text>
      </BottomSheet>,
      { initialValues: { '__sheet_child-sheet': true } },
    )
    expect(JSON.stringify(toJSON())).toContain('Sheet Content')
  })

  it('renders children even when closed (animated, not conditionally unmounted)', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'closed-child', snapPoints: ['50%'] }}>
        <Text>Closed Content</Text>
      </BottomSheet>,
    )
    expect(JSON.stringify(toJSON())).toContain('Closed Content')
  })

  // ── Backdrop ────────────────────────────────────────────────────────────────

  it('renders backdrop with accessibilityRole button and label when open', () => {
    const { toJSON } = renderWithProviders(
      <BottomSheet config={{ id: 'backdrop-sheet', snapPoints: ['50%'], closeOnBackdrop: true }} />,
      { initialValues: { '__sheet_backdrop-sheet': true } },
    )
    const json = JSON.stringify(toJSON())
    // TouchableWithoutFeedback backdrop has accessibilityRole="button"
    expect(json).toContain('"button"')
    expect(json).toContain('Close sheet')
  })
})
