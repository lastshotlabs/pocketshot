import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Platform,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { SelectConfig, SelectOption } from './types'

export function Select({ config }: { config: SelectConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const [modalVisible, setModalVisible] = useState(false)

  const resolvedOptions = resolveFromRef<SelectOption[]>(config.options, values) ?? []
  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const selectedOption = resolvedOptions.find((option) => option.value === resolvedValue)
  const displayText = selectedOption?.label ?? config.placeholder
  const isPlaceholder = selectedOption == null
  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(modalVisible ? (['open'] as const) : []),
    ...(selectedOption != null ? (['selected'] as const) : []),
  ]
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'xs' },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      marginBottom: 'xs',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })
  const triggerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      bg: 'inputBackground',
      border: '1px solid inputBorder',
      borderRadius: 'md',
      paddingX: 'sm',
      paddingY: 'sm',
      minHeight: 48,
      states: {
        open: {
          border: '1px solid borderFocus',
        },
      },
    },
    componentSurface: config.slots?.trigger as Record<string, unknown> | undefined,
    activeStates,
  })
  const triggerTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'base',
      color: isPlaceholder ? 'inputPlaceholder' : 'inputText',
    },
    componentSurface: config.slots?.triggerText as Record<string, unknown> | undefined,
    activeStates,
  })
  const chevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginLeft: 'sm',
    },
    componentSurface: config.slots?.chevron as Record<string, unknown> | undefined,
    activeStates,
  })
  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      bg: 'overlay',
      justifyContent: 'end',
      opacity: 0.8,
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
    activeStates,
  })
  const sheetSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderTopLeftRadius: 'xl',
      borderTopRightRadius: 'xl',
      maxHeight: '60%',
      paddingBottom: Platform.OS === 'android' ? tokens.spacing[4] : 0,
    },
    componentSurface: config.slots?.sheet as Record<string, unknown> | undefined,
    activeStates,
  })
  const sheetInnerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'lg',
    },
    componentSurface: config.slots?.sheetInner as Record<string, unknown> | undefined,
    activeStates,
  })
  const sheetTitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
      marginBottom: 'md',
    },
    componentSurface: config.slots?.sheetTitle as Record<string, unknown> | undefined,
    activeStates,
  })

  function handleSelect(option: SelectOption) {
    setValue(config.id, option.value)
    setModalVisible(false)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        {config.label != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(labelSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="text"
          >
            {config.label}
          </Text>
        ) : null}
        <TouchableOpacity
          style={triggerSurface.style as ViewStyle | undefined}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={config.label ?? config.id}
          accessibilityHint="Opens a list of options to choose from"
          testID={config.testID ?? config.id}
        >
          <Text
            style={{
              ...sharedTextStyle,
              ...(triggerTextSurface.style as TextStyle | undefined),
            }}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          <Text
            style={{
              ...sharedTextStyle,
              ...(chevronSurface.style as TextStyle | undefined),
            }}
          >
            {'\u25BE'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
          accessibilityViewIsModal
        >
          <TouchableOpacity
            style={backdropSurface.style as ViewStyle | undefined}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close options"
          >
            <SafeAreaView style={sheetSurface.style as ViewStyle | undefined}>
              <View style={sheetInnerSurface.style as ViewStyle | undefined}>
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(sheetTitleSurface.style as TextStyle | undefined),
                  }}
                >
                  {config.label ?? 'Select an option'}
                </Text>
                <FlatList<SelectOption>
                  data={resolvedOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const selected = item.value === resolvedValue
                    const optionStates: RuntimeSurfaceState[] | undefined = [
                      ...(selected ? (['selected'] as const) : []),
                    ]
                    const optionSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingY: 'sm',
                        paddingX: 'xs',
                        borderRadius: 'md',
                        states: {
                          selected: {
                            bg: 'muted',
                          },
                        },
                      },
                      componentSurface: config.slots?.option as Record<string, unknown> | undefined,
                      activeStates: optionStates,
                    })
                    const optionTextSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        flex: 1,
                        fontSize: 'base',
                        color: selected ? 'primary' : 'foreground',
                        fontWeight: selected ? 'semibold' : 'regular',
                      },
                      componentSurface: config.slots?.optionText as Record<string, unknown> | undefined,
                      activeStates: optionStates,
                    })
                    const checkmarkSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        fontSize: 'base',
                        color: 'primary',
                        marginLeft: 'sm',
                      },
                      componentSurface: config.slots?.checkmark as Record<string, unknown> | undefined,
                      activeStates: optionStates,
                    })

                    return (
                      <TouchableOpacity
                        style={optionSurface.style as ViewStyle | undefined}
                        onPress={() => handleSelect(item)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        accessibilityState={{ selected }}
                        testID={`${config.id}-option-${item.value}`}
                      >
                        <Text
                          style={{
                            ...sharedTextStyle,
                            ...(optionTextSurface.style as TextStyle | undefined),
                          }}
                        >
                          {item.label}
                        </Text>
                        {selected ? (
                          <Text
                            style={{
                              ...sharedTextStyle,
                              ...(checkmarkSurface.style as TextStyle | undefined),
                            }}
                          >
                            {'\u2713'}
                          </Text>
                        ) : null}
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
