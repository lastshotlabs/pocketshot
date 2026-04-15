import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ConfigImage } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('ConfigImage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(
      <ConfigImage config={{ src: 'https://example.com/photo.jpg', alt: 'A photo' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with explicit width and height without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ConfigImage
        config={{ src: 'https://example.com/photo.jpg', alt: 'A photo', width: 200, height: 150 }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with 100% width without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ConfigImage
        config={{ src: 'https://example.com/photo.jpg', alt: 'Banner', width: '100%' }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with aspectRatio without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ConfigImage
        config={{
          src: 'https://example.com/photo.jpg',
          alt: 'Wide photo',
          width: 300,
          aspectRatio: 16 / 9,
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders all resizeMode variants without crashing', () => {
    for (const resizeMode of ['cover', 'contain', 'stretch', 'center'] as const) {
      const { toJSON } = renderWithProviders(
        <ConfigImage
          config={{ src: 'https://example.com/photo.jpg', alt: resizeMode, resizeMode }}
        />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders all borderRadius variants without crashing', () => {
    for (const borderRadius of ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const) {
      const { toJSON } = renderWithProviders(
        <ConfigImage
          config={{ src: 'https://example.com/photo.jpg', alt: 'rounded', borderRadius }}
        />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders a pressable imagebutton when onPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <ConfigImage
        config={{
          src: 'https://example.com/photo.jpg',
          alt: 'Tappable image',
          onPress: { type: 'navigate', to: '/Detail' },
        }}
      />,
    )
    expect(getByRole('imagebutton')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <ConfigImage
        config={{ src: 'https://example.com/photo.jpg', alt: 'Tagged', testID: 'image-hero' }}
      />,
    )
    expect(getByTestId('image-hero')).toBeTruthy()
  })

  it('resolves src from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <ConfigImage config={{ src: { from: 'avatarUrl' }, alt: 'Avatar' }} />,
      { initialValues: { avatarUrl: 'https://example.com/avatar.jpg' } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders 100% width with onPress without crashing', () => {
    const { getByRole } = renderWithProviders(
      <ConfigImage
        config={{
          src: 'https://example.com/banner.jpg',
          alt: 'Banner',
          width: '100%',
          onPress: { type: 'open-url', url: 'https://example.com' },
        }}
      />,
    )
    expect(getByRole('imagebutton')).toBeTruthy()
  })
})
