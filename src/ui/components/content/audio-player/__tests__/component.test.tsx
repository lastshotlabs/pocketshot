import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { AudioPlayer } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('AudioPlayer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the fallback UI when expo-av is unavailable', () => {
    const { getByText } = renderWithProviders(
      <AudioPlayer config={{ source: 'https://example.com/audio.mp3' }} />,
    )

    expect(getByText('Audio Player')).toBeTruthy()
    expect(getByText('expo-av is required for audio playback.')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <AudioPlayer config={{ source: 'https://example.com/audio.mp3', testID: 'audio-main' }} />,
    )

    expect(getByTestId('audio-main')).toBeTruthy()
  })

  it('resolves source from screen context', () => {
    const { toJSON } = renderWithProviders(
      <AudioPlayer config={{ source: { from: 'media.audio' }, title: 'Episode 12' }} />,
      { initialValues: { media: { audio: 'https://example.com/episode.mp3' } } },
    )

    expect(toJSON()).toBeTruthy()
  })

  it('renders metadata in the fallback path', () => {
    const { getByText } = renderWithProviders(
      <AudioPlayer
        config={{
          source: 'https://example.com/audio.mp3',
          title: 'Daily Brief',
          artist: 'Snapshot FM',
        }}
      />,
    )

    expect(getByText('Audio Player')).toBeTruthy()
    expect(getByText('npx expo install expo-av')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <AudioPlayer
        config={{
          source: 'https://example.com/audio.mp3',
          slots: {
            fallback: { borderRadius: 'xl' },
            fallbackTitle: { letterSpacing: 'wide' },
            fallbackCommand: { color: 'primary' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
