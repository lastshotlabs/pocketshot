import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { HeaderBase, type HeaderActionItem } from './standalone'
import type { HeaderConfig } from './types'

export function Header({ config }: { config: HeaderConfig }) {
  const { dispatch } = useScreenContext()

  const handleBack = useCallback(() => {
    void dispatch({ type: 'navigate', to: '..' })
  }, [dispatch])

  const leftAction: HeaderActionItem | undefined = useMemo(() => {
    if (config.leftAction == null) return undefined
    return {
      icon: config.leftAction.icon,
      label: config.leftAction.label,
      onPress: () => {
        void dispatch(config.leftAction!.action)
      },
    }
  }, [config.leftAction, dispatch])

  const rightActions: HeaderActionItem[] = useMemo(() => {
    const list = config.rightActions ?? (config.rightAction ? [config.rightAction] : [])
    return list.map((ra) => ({
      icon: ra.icon,
      label: ra.label,
      onPress: () => {
        void dispatch(ra.action)
      },
    }))
  }, [config.rightAction, config.rightActions, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <HeaderBase
        id={config.id}
        testID={config.testID}
        title={config.title}
        subtitle={config.subtitle}
        showBack={config.showBack}
        onBackPress={handleBack}
        leftAction={leftAction}
        rightActions={rightActions}
      />
    </ComponentWrapper>
  )
}
