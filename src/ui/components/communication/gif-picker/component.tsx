import React, { useCallback, useEffect, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useAppContext } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { GifPickerBase, type GifResult } from './standalone'
import type { GifPickerConfig } from './types'
import { GifPickerSchema } from './schema'

export function GifPicker({ config: inputConfig }: { config: GifPickerConfig }) {
  const config = GifPickerSchema.parse(inputConfig)
  const { api } = useAppContext()
  const { dispatch, setValue } = useScreenContext()

  const [visible, setVisible] = useState(false)
  const [results, setResults] = useState<GifResult[]>([])
  const [searching, setSearching] = useState(false)

  const hasEndpoint = !!config.apiEndpoint

  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, visible, setValue])

  const handleOpen = useCallback(() => {
    setVisible(true)
    setResults([])
  }, [])

  const handleClose = useCallback(() => setVisible(false), [])

  const handleSearch = useCallback(
    async (query: string) => {
      if (!config.apiEndpoint || !query.trim()) {
        setResults([])
        return
      }
      setSearching(true)
      try {
        const separator = config.apiEndpoint.includes('?') ? '&' : '?'
        const url = `${config.apiEndpoint}${separator}q=${encodeURIComponent(query)}`
        const response = await api.get<{ results: GifResult[] }>(url)
        setResults(response?.results ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    },
    [config.apiEndpoint, api],
  )

  const handleSelect = useCallback(
    (gif: GifResult) => {
      setValue('__selectedGif', gif)
      setVisible(false)
      void dispatch(config.onSelect)
    },
    [setValue, dispatch, config.onSelect],
  )

  const sampleGifs: GifResult[] = (config.sampleGifs ?? []).map((g) => ({
    id: g.id,
    url: g.url,
    preview: g.preview ?? g.url,
    width: g.width ?? 200,
    height: g.height ?? 150,
  }))

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <GifPickerBase
        id={config.id}
        testID={config.testID}
        visible={visible}
        showTrigger
        onOpen={handleOpen}
        onClose={handleClose}
        onSelect={handleSelect}
        onSearch={handleSearch}
        results={results}
        searching={searching}
        sampleGifs={sampleGifs}
        provider={config.provider}
        placeholder={config.placeholder}
        hasEndpoint={hasEndpoint}
      />
    </ComponentWrapper>
  )
}
