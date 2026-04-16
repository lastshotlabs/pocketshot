import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import type { StackConfig } from './types'

export function Stack({ config, children }: { config: StackConfig; children?: React.ReactNode }) {
  const tokens = useTokens()
  const itemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.item as Record<string, unknown> | undefined,
  })
  const items = React.Children.toArray(children)

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={styles.container}
    >
      {items.map((child, index) => (
        <View
          key={React.isValidElement(child) && child.key != null ? child.key : index}
          style={itemSurface.style as ViewStyle | undefined}
        >
          {child}
        </View>
      ))}
    </ComponentWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
})

