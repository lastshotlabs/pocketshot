import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { ImageViewer } from '../component'
import { ImageViewerSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return ImageViewerSchema.parse({
    id: 'viewer',
    source: 'https://example.com/photo.jpg',
    ...overrides,
  })
}

describe('ImageViewer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a thumbnail without crashing', () => {
    const { toJSON } = renderWithProviders(<ImageViewer config={cfg({ alt: 'Photo' })} />)

    expect(toJSON()).toBeTruthy()
  })

  it('applies the thumbnail testID', () => {
    const { getByTestId } = renderWithProviders(<ImageViewer config={cfg({ alt: 'Photo' })} />)

    expect(getByTestId('viewer-thumbnail')).toBeTruthy()
  })

  it('resolves the image source from screen context', () => {
    const { toJSON } = renderWithProviders(
      <ImageViewer
        config={cfg({
          source: { from: 'gallery.hero' },
          alt: 'Hero',
          width: '60%',
          borderRadius: 'lg',
        })}
      />,
      { initialValues: { gallery: { hero: 'https://example.com/hero.jpg' } } },
    )

    expect(toJSON()).toBeTruthy()
  })

  it('renders with shared width and borderRadius props', () => {
    const { toJSON } = renderWithProviders(
      <ImageViewer config={cfg({ width: 220, height: 160, borderRadius: 'full' })} />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
