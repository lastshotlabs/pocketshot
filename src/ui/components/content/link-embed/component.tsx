import React from 'react'
import { Linking } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { LinkEmbedBase } from './standalone'
import type { LinkEmbedConfig } from './types'

export function LinkEmbed({ config }: { config: LinkEmbedConfig }) {
  const { values, dispatch } = useScreenContext()

  const url = String(resolveFromRef(config.url, values) ?? '')
  const title =
    config.title != null ? String(resolveFromRef(config.title, values) ?? '') : undefined
  const description =
    config.description != null
      ? String(resolveFromRef(config.description, values) ?? '')
      : undefined
  const imageUrl =
    config.imageUrl != null ? String(resolveFromRef(config.imageUrl, values) ?? '') : undefined
  const domain =
    config.domain != null ? String(resolveFromRef(config.domain, values) ?? '') : undefined

  const handlePress = React.useMemo(() => {
    if (config.onPress != null) {
      return () => void dispatch(config.onPress!)
    }
    return () => void Linking.openURL(url)
  }, [config.onPress, dispatch, url])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <LinkEmbedBase
        url={url}
        title={title}
        description={description}
        imageUrl={imageUrl}
        favicon={config.favicon}
        domain={domain}
        provider={config.provider}
        onPress={handlePress}
        videoId={config.videoId}
        authorName={config.authorName}
        authorHandle={config.authorHandle}
        authorAvatarUrl={config.authorAvatarUrl}
        tweetText={config.tweetText}
        metrics={config.metrics}
        repoOwner={config.repoOwner}
        repoName={config.repoName}
        repoDescription={config.repoDescription}
        language={config.language}
        languageColor={config.languageColor}
        stars={config.stars}
        forks={config.forks}
        trackName={config.trackName}
        artistName={config.artistName}
        albumArtUrl={config.albumArtUrl}
        durationMs={config.durationMs}
        fileName={config.fileName}
        lastModified={config.lastModified}
        thumbnailUrl={config.thumbnailUrl}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
