import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ScreenContextProvider } from '../context/ScreenContext'
import type { ApiClient } from '../../api/client'
import type { ScreenConfig, ComponentConfig } from './types'
import { ManifestStructural } from './structural'

interface ScreenRendererProps {
  screen: ScreenConfig
  api: ApiClient
  /** Registry of component type key → React component. Provided by ManifestApp. */
  componentRegistry: Record<string, React.ComponentType<ComponentConfig>>
}

/**
 * Renders a screen from its config. Wraps all components in ScreenContextProvider
 * and renders them in declaration order.
 *
 * In development, unknown component types render a visible warning. In production
 * they are silently skipped.
 */
export function ScreenRenderer({ screen, api, componentRegistry }: ScreenRendererProps) {
  return (
    <ScreenContextProvider api={api} initialValues={screen.initialValues}>
      <ManifestStructural>
        {screen.components.map((componentConfig, index) => {
          const ComponentType = componentRegistry[componentConfig.type]
          if (!ComponentType) {
            if (__DEV__) {
              return (
                <View key={componentConfig.id ?? index} style={styles.unknownComponent}>
                  <Text style={styles.unknownText}>Unknown component: {componentConfig.type}</Text>
                </View>
              )
            }
            return null
          }
          return (
            <ComponentType
              key={componentConfig.id ?? `${componentConfig.type}-${index}`}
              {...componentConfig}
            />
          )
        })}
      </ManifestStructural>
    </ScreenContextProvider>
  )
}

const styles = StyleSheet.create({
  unknownComponent: {
    padding: 8,
    backgroundColor: '#fff3cd',
    margin: 4,
    borderRadius: 4,
  },
  unknownText: { fontSize: 12, color: '#856404' },
})
