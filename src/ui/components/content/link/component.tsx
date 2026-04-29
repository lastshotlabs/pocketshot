import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { LinkBase, type LinkSize } from './standalone'
import type { LinkConfig } from './types'

export function Link({ config }: { config: LinkConfig }) {
  const { values, dispatch } = useScreenContext()
  const text = resolveFromRef(config.text, values) as string

  const handlePress = useCallback(() => {
    void dispatch(config.action)
  }, [config.action, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <LinkBase
        text={text}
        size={(config.size ?? 'md') as LinkSize}
        underline={config.underline}
        onPress={handlePress}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID ?? config.id}
      />
    </ComponentWrapper>
  )
}
