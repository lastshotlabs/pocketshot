import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type TabsVariant = 'default' | 'pills' | 'underline'

export interface TabItem {
  id: string
  label: string
  icon?: string
}

function makeStyles(tokens: DesignTokens, variant: TabsVariant) {
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
    tabIcon: { fontSize: tokens.typography.fontSizeMd },
    activeTab_default: { backgroundColor: tokens.colors.primary },
    activeTab_pills: { backgroundColor: tokens.colors.primary },
    activeTab_underline: {
      borderBottomWidth: 2,
      borderBottomColor: tokens.colors.primary,
      marginBottom: -1,
    },
    activeLabel: { color: tokens.colors.primaryForeground },
    inactiveLabel: { color: tokens.colors.textMuted },
  })
}

export interface TabsBaseProps {
  /** Tabs to render. */
  tabs: TabItem[]
  /** Controlled active tab id. */
  activeTab?: string
  /** Default tab when uncontrolled. */
  defaultTab?: string
  /** Visual variant. */
  variant?: TabsVariant
  /** Called when active tab changes. */
  onTabChange?: (tabId: string) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Tabs — plain React props, no manifest required.
 *
 * @example
 * <TabsBase
 *   tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]}
 *   onTabChange={setActive}
 * />
 */
export function TabsBase({
  tabs,
  activeTab,
  defaultTab,
  variant = 'default',
  onTabChange,
  style,
  testID,
  id,
}: TabsBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens, variant), [tokens, variant])
  const [localActive, setLocalActive] = useState<string>(
    activeTab ?? defaultTab ?? tabs[0]?.id ?? '',
  )
  const isControlled = activeTab !== undefined
  const current = isControlled ? activeTab : localActive

  useEffect(() => {
    if (isControlled) setLocalActive(activeTab as string)
  }, [activeTab, isControlled])

  const handleTabPress = (tabId: string) => {
    if (!isControlled) setLocalActive(tabId)
    onTabChange?.(tabId)
  }

  return (
    <View style={[styles.container, style]} testID={testID ?? id}>
      {tabs.map((tab) => {
        const isActive = tab.id === current
        const activeStyle =
          variant === 'default'
            ? styles.activeTab_default
            : variant === 'pills'
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
            testID={testID ? `${testID}-${tab.id}` : id ? `${id}-${tab.id}` : undefined}
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
  )
}
