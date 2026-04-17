import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { LinkEmbed } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('LinkEmbed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a generic link preview', () => {
    const { getByText, getByRole } = renderWithProviders(
      <LinkEmbed
        config={{
          url: 'https://example.com/articles/snapshot',
          title: 'Snapshot article',
          description: 'Universal surfaces for mobile parity.',
        }}
      />,
    )

    expect(getByRole('link')).toBeTruthy()
    expect(getByText('Snapshot article')).toBeTruthy()
    expect(getByText('Universal surfaces for mobile parity.')).toBeTruthy()
  })

  it('auto-detects and renders YouTube embeds', () => {
    const { getByText } = renderWithProviders(
      <LinkEmbed
        config={{
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Launch recap',
        }}
      />,
    )

    expect(getByText('YouTube')).toBeTruthy()
    expect(getByText('Launch recap')).toBeTruthy()
  })

  it('renders GitHub repository metadata', () => {
    const { getByText } = renderWithProviders(
      <LinkEmbed
        config={{
          url: 'https://github.com/lastshotlabs/snapshot',
          provider: 'github',
          language: 'TypeScript',
          stars: 1200,
        }}
      />,
    )

    expect(getByText('lastshotlabs / snapshot')).toBeTruthy()
    expect(getByText('TypeScript')).toBeTruthy()
  })

  it('resolves content from screen context', () => {
    const { getByText } = renderWithProviders(
      <LinkEmbed
        config={{
          url: { from: 'embed.url' },
          title: { from: 'embed.title' },
          description: { from: 'embed.description' },
        }}
      />,
      {
        initialValues: {
          embed: {
            url: 'https://example.com/from-ref',
            title: 'Resolved title',
            description: 'Resolved description',
          },
        },
      },
    )

    expect(getByText('Resolved title')).toBeTruthy()
    expect(getByText('Resolved description')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <LinkEmbed
        config={{
          url: 'https://open.spotify.com/track/123',
          provider: 'spotify',
          title: 'Pocketshot theme',
          slots: {
            card: { borderRadius: 'xl' },
            title: { letterSpacing: 'wide' },
            playButton: { borderRadius: 'full' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
