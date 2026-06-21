import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, toNumericDimensionValue } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { RichTextEditorBase } from './standalone'
import type { EditorToolbarItem, RichTextEditorConfig } from './types'

export function RichTextEditor({ config }: { config: RichTextEditorConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [localValue, setLocalValue] = useState<string>(config.defaultValue ?? '')

  const { minHeight, maxHeight } = useMemo(() => {
    const resolvedStyle = resolveNativeStyleProps(
      {
        minHeight: config.minHeight,
        maxHeight: config.maxHeight,
      },
      tokens,
    )

    const resolvedMin = toNumericDimensionValue(resolvedStyle.minHeight) ?? 120
    const resolvedMax = toNumericDimensionValue(resolvedStyle.maxHeight) ?? 400

    return {
      minHeight: resolvedMin,
      maxHeight: Math.max(resolvedMin, resolvedMax),
    }
  }, [config.minHeight, config.maxHeight, tokens])

  useEffect(() => {
    if (config.defaultValue != null) {
      setValue(config.id, config.defaultValue)
    }
  }, [config.defaultValue, config.id, setValue])

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      setValue(config.id, text)
      if (config.onChangeAction != null) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RichTextEditorBase
        value={localValue}
        placeholder={config.placeholder}
        toolbar={config.toolbar as EditorToolbarItem[] | undefined}
        minHeight={minHeight}
        maxHeight={maxHeight}
        onChangeText={handleChange}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
