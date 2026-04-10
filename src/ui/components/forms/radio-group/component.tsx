import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { RadioGroupConfig } from './types'

interface OptionItem {
  value: string
  label: string
  disabled?: boolean
}

export function RadioGroup({ config }: { config: RadioGroupConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedOptions = resolveFromRef(config.options, values) as OptionItem[]
  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined

  const [selected, setSelected] = useState<string | undefined>(
    resolvedValue ?? config.defaultValue,
  )

  useEffect(() => {
    if (resolvedValue != null) {
      setSelected(resolvedValue)
    }
  }, [resolvedValue])

  const styles = useMemo(() => makeStyles(tokens, config.orientation), [tokens, config.orientation])

  const handleSelect = useCallback(
    (optionValue: string) => {
      setSelected(optionValue)
      setValue(config.id, optionValue)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, setValue, dispatch],
  )

  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <View
          style={styles.optionsList}
          accessibilityRole="radiogroup"
          accessibilityLabel={config.label}
        >
          {(resolvedOptions ?? []).map((option) => {
            const isSelected = selected === option.value
            const disabled = option.disabled ?? false
            const itemStyles = makeItemStyles(tokens, isSelected, disabled)

            return (
              <TouchableOpacity
                key={option.value}
                style={itemStyles.row}
                onPress={() => handleSelect(option.value)}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isSelected, disabled }}
                testID={`${testIDBase}-option-${option.value}`}
              >
                <View style={itemStyles.outerCircle}>
                  {isSelected && <View style={itemStyles.innerDot} />}
                </View>
                <Text style={itemStyles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, orientation: RadioGroupConfig['orientation']) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[2],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    optionsList: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
      gap: orientation === 'horizontal' ? tokens.spacing[4] : tokens.spacing[3],
    },
  })
}

function makeItemStyles(tokens: DesignTokens, isSelected: boolean, disabled: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[3],
      opacity: disabled ? 0.5 : 1,
    },
    outerCircle: {
      width: 22,
      height: 22,
      borderRadius: tokens.radius.full,
      borderWidth: 2,
      borderColor: isSelected ? tokens.colors.primary : tokens.colors.inputBorder,
      backgroundColor: tokens.colors.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerDot: {
      width: 12,
      height: 12,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.primary,
    },
    optionLabel: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
  })
}
