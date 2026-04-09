import React, { useState, useEffect } from 'react'
import { View, Text, Switch as RNSwitch, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { SwitchConfig } from './types'

export function Switch({ config }: { config: SwitchConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? resolveFromRef(config.value, values) : undefined

  const [localValue, setLocalValue] = useState<boolean>(
    (resolvedValue as boolean | undefined) ?? config.defaultValue,
  )

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as boolean)
    }
  }, [resolvedValue])

  const styles = makeStyles(tokens)

  function handleChange(next: boolean) {
    setLocalValue(next)
    setValue(config.id, next)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.row}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <RNSwitch
          value={localValue}
          onValueChange={handleChange}
          disabled={config.disabled}
          trackColor={{
            false: tokens.colors.border,
            true: tokens.colors.primary,
          }}
          thumbColor={tokens.colors.primaryForeground}
          ios_backgroundColor={tokens.colors.border}
          accessibilityLabel={config.label ?? config.id}
          accessibilityRole="switch"
          accessibilityState={{ checked: localValue, disabled: config.disabled }}
          testID={config.testID ?? config.id}
        />
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: tokens.spacing[2],
    },
    label: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      marginRight: tokens.spacing[3],
    },
  })
}
