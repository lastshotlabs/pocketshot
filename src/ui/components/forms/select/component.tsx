import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { SelectConfig, SelectOption } from './types'

export function Select({ config }: { config: SelectConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const [modalVisible, setModalVisible] = useState(false)

  const resolvedOptions = resolveFromRef<SelectOption[]>(config.options, values) ?? []
  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined

  const selectedOption = resolvedOptions.find((o) => o.value === resolvedValue)
  const displayText = selectedOption?.label ?? config.placeholder

  const styles = makeStyles(tokens, selectedOption == null)

  function handleSelect(option: SelectOption) {
    setValue(config.id, option.value)
    setModalVisible(false)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={config.label ?? config.id}
          accessibilityHint="Opens a list of options to choose from"
          testID={config.testID ?? config.id}
        >
          <Text style={styles.triggerText} numberOfLines={1}>
            {displayText}
          </Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
          accessibilityViewIsModal
        >
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close options"
          >
            <SafeAreaView style={styles.sheet}>
              <View style={styles.sheetInner}>
                <Text style={styles.sheetTitle}>{config.label ?? 'Select an option'}</Text>
                <FlatList<SelectOption>
                  data={resolvedOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const isSelected = item.value === resolvedValue
                    return (
                      <TouchableOpacity
                        style={[styles.option, isSelected && styles.optionSelected]}
                        onPress={() => handleSelect(item)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        accessibilityState={{ selected: isSelected }}
                        testID={`${config.id}-option-${item.value}`}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {item.label}
                        </Text>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    )
                  }}
                />
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, isPlaceholder: boolean) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      minHeight: 48,
    },
    triggerText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: isPlaceholder ? tokens.colors.inputPlaceholder : tokens.colors.inputText,
    },
    chevron: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginLeft: tokens.spacing[2],
    },
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay + 'CC',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.xl,
      borderTopRightRadius: tokens.radius.xl,
      maxHeight: '60%',
      ...Platform.select({
        android: { paddingBottom: tokens.spacing[4] },
      }),
    },
    sheetInner: {
      padding: tokens.spacing[4],
    },
    sheetTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[3],
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[2],
      borderRadius: tokens.radius.md,
    },
    optionSelected: {
      backgroundColor: tokens.colors.surfaceAlt,
    },
    optionText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    optionTextSelected: {
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
    },
    checkmark: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primary,
      marginLeft: tokens.spacing[2],
    },
  })
}
