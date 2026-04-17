import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { VideoPlayer } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('VideoPlayer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the fallback UI when expo-av is unavailable', () => {
    const { getByText } = renderWithProviders(
      <VideoPlayer config={{ source: 'https://example.com/video.mp4' }} />,
    )

    expect(getByText('Video Player')).toBeTruthy()
    expect(getByText('npx expo install expo-av')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <VideoPlayer config={{ source: 'https://example.com/video.mp4', testID: 'video-main' }} />,
    )

    expect(getByTestId('video-main')).toBeTruthy()
  })

  it('resolves source and poster from screen context', () => {
    const { toJSON } = renderWithProviders(
      <VideoPlayer
        config={{
          source: { from: 'media.video' },
          poster: { from: 'media.poster' },
        }}
      />,
      {
        initialValues: {
          media: {
            video: 'https://example.com/video.mp4',
            poster: 'https://example.com/poster.jpg',
          },
        },
      },
    )

    expect(toJSON()).toBeTruthy()
  })

  it('accepts custom aspect ratios', () => {
    const { toJSON } = renderWithProviders(
      <VideoPlayer config={{ source: 'https://example.com/video.mp4', aspectRatio: 1 }} />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <VideoPlayer
        config={{
          source: 'https://example.com/video.mp4',
          slots: {
            container: { borderRadius: 'xl' },
            centerPlayIcon: { letterSpacing: 'wide' },
            fallbackCommand: { color: 'primary' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
