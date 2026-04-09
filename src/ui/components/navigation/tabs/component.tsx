import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TabsConfig } from './types'

function makeStyles(tokens: DesignTokens, variant: TabsConfig['variant']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: variant === 'pills' ? tokens.colors.surfaceAlt : tokens.colors.surface,
      borderRadius: variant === 'pills' ? tokens.radius.full : 0,
      borderBottomWidth: variant === 'underline' ? 1 : 0,
      borderBottomColor: tokens.colors.border,
      padding: variant === 'pills' ? tokens.spacing[1] : 0,
      gap: variant === 'pills' ? tokens.spacing[1] : 0,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[2],
      paddingHorizontal: tokens.spacing[3],
      gap: tokens.spacing[1],
      borderRadius: variant === 'pills' ? tokens.radius.full : 0,
    },
    tabLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    tabIcon: {
      fontSize: tokens.typography.fontSizeMd,
    },
    activeTab_default: {
      backgroundColor: tokens.colors.primary,
    },
    activeTab_pills: {
      backgroundColor: tokens.colors.primary,
    },
    activeTab_underline: {
      borderBottomWidth: 2,
      borderBottomColor: tokens.colors.primary,
      marginBottom: -1,
    },
    activeLabel: {
      color: tokens.colors.primaryForeground,
    },
    inactiveLabel: {
      color: tokens.colors.textMuted,
    },
  })
}

/**
 * Config-driven tab bar. Publishes the active tab id to ScreenContext under
 * `config.id`, enabling other components to react via `{ from: config.id }`.
 */
export function Tabs({ config }: { config: TabsConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedActiveTab =
    config.activeTab != null ? (resolveFromRef(config.activeTab, values) as string | undefined) : undefined

  const defaultTab = config.defaultTab ?? config.tabs[0]?.id ?? ''
  const [localActive, setLocalActive] = useState<string>(resolvedActiveTab ?? defaultTab)

  const activeTab = resolvedActiveTab ?? localActive

  // Sync from context if controlled
  useEffect(() => {
    if (resolvedActiveTab != null) {
      setLocalActive(resolvedActiveTab)
    }
  }, [resolvedActiveTab])

  // Publish initial value
  useEffect(() => {
    setValue(config.id, activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleTabPress(tabId: string) {
    setLocalActive(tabId)
    setValue(config.id, tabId)
    setValue('__activeTab', tabId)
    if (config.onTabChange) {
      void dispatch(config.onTabChange)
    }
  }

  const styles = makeStyles(tokens, config.variant)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false}>
        <View style={styles.container}>
          {config.tabs.map((tab) => {
            const isActive = tab.id === activeTab
            const activeStyle =
              config.variant === 'default'
                ? styles.activeTab_default
                : config.variant === 'pills'
                  ? styles.activeTab_pills
                  : styles.activeTab_underline

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && activeStyle]}
                onPress={() => handleTabPress(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                testID={config.testID ? `${config.testID}-${tab.id}` : `${config.id}-${tab.id}`}
              >
                {tab.icon != null && (
                  <Text
                    style={[styles.tabIcon, isActive ? styles.activeLabel : styles.inactiveLabel]}
                    accessibilityElementsHidden
                  >
                    {tab.icon}
                  </Text>
                )}
                <Text style={[styles.tabLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </ComponentWrapper>
  )
}
