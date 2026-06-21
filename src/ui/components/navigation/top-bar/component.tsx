import React, { useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { TopBarBase, type TopBarActionItem, type TopBarLeftAction } from './standalone'
import type { Action } from '../../../actions/types'
import type { TopBarConfig } from './types'

export function TopBar({ config }: { config: TopBarConfig }) {
  const { dispatch, values } = useScreenContext()
  const resolvedTitle = resolveFromRef(config.title, values) as string | undefined

  const leftAction: TopBarLeftAction | undefined = useMemo(() => {
    if (config.leftAction == null) return undefined
    if (typeof config.leftAction === 'string') {
      const kind = config.leftAction as 'back' | 'menu' | 'close'
      return {
        kind,
        onPress: () => {
          if (kind === 'back' || kind === 'close') {
            void dispatch({ type: 'navigate', to: '..' })
            return
          }
          void dispatch({ type: 'set-value', target: '__drawerMenu', value: true })
        },
      }
    }
    const customAction = config.leftAction as { icon: string; onPress: Action }
    return {
      kind: 'custom',
      icon: customAction.icon,
      onPress: () => {
        void dispatch(customAction.onPress)
      },
    }
  }, [config.leftAction, dispatch])

  const rightActions: TopBarActionItem[] = useMemo(
    () =>
      (config.rightActions ?? []).map((ra) => ({
        icon: ra.icon,
        badge: ra.badge,
        onPress: () => {
          void dispatch(ra.onPress)
        },
      })),
    [config.rightActions, dispatch],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TopBarBase
        id={config.id}
        testID={config.testID}
        title={resolvedTitle ?? ''}
        subtitle={config.subtitle}
        transparent={config.transparent ?? false}
        elevated={config.elevated ?? true}
        leftAction={leftAction}
        rightActions={rightActions}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
