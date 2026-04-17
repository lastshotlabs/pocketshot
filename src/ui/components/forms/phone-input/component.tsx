import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
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
import type { PhoneInputConfig, CountryData } from './types'

const COUNTRIES: CountryData[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '\uD83C\uDDE8\uD83C\uDDE6' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '\uD83C\uDDE6\uD83C\uDDFA' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '\uD83C\uDDF2\uD83C\uDDFD' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '\uD83C\uDDEE\uD83C\uDDF9' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '\uD83C\uDDF3\uD83C\uDDF1' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '\uD83C\uDDF8\uD83C\uDDEA' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '\uD83C\uDDE8\uD83C\uDDED' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '\uD83C\uDDF3\uD83C\uDDFF' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '\uD83C\uDDF8\uD83C\uDDEC' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '\uD83C\uDDE6\uD83C\uDDEA' },
]

function findCountry(code: string): CountryData {
  return COUNTRIES.find((country) => country.code === code) ?? COUNTRIES[0]
}

export function PhoneInput({ config }: { config: PhoneInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [country, setCountry] = useState<CountryData>(() => findCountry(config.defaultCountry ?? 'US'))
  const [number, setNumber] = useState('')
  const [pickerVisible, setPickerVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [focused, setFocused] = useState(false)

  const filteredCountries = useMemo(() => {
    if (!searchText.trim()) return COUNTRIES
    const lowered = searchText.toLowerCase()
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(lowered) ||
        item.code.toLowerCase().includes(lowered) ||
        item.dialCode.includes(searchText),
    )
  }, [searchText])

  useEffect(() => {
    const formatted = number ? `${country.dialCode} ${number}` : ''
    setValue(config.id, {
      countryCode: country.code,
      dialCode: country.dialCode,
      number,
      formatted,
    })
  }, [config.id, country, number, setValue])

  const hasError = config.errorText != null
  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(focused ? (['focus'] as const) : []),
    ...(hasError ? (['invalid'] as const) : []),
    ...(pickerVisible ? (['open'] as const) : []),
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
  const inputRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      bg: 'inputBackground',
      border: hasError ? '1px solid error' : focused ? '1px solid borderFocus' : '1px solid inputBorder',
      borderRadius: 'md',
      minHeight: 48,
      states: {
        focus: {
          border: '1px solid borderFocus',
        },
        invalid: {
          border: '1px solid error',
        },
      },
    },
    componentSurface: config.slots?.inputRow as Record<string, unknown> | undefined,
    activeStates,
  })
  const countryButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'sm',
      paddingY: 'xs',
      gap: 'xs',
    },
    componentSurface: config.slots?.countryButton as Record<string, unknown> | undefined,
    activeStates,
  })
  const countryFlagSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
    },
    componentSurface: config.slots?.countryFlag as Record<string, unknown> | undefined,
    activeStates,
  })
  const countryDialCodeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: config.slots?.countryDialCode as Record<string, unknown> | undefined,
    activeStates,
  })
  const chevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
    },
    componentSurface: config.slots?.chevron as Record<string, unknown> | undefined,
    activeStates,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: 1,
      height: 24,
      bg: 'border',
    },
    componentSurface: config.slots?.divider as Record<string, unknown> | undefined,
    activeStates,
  })
  const phoneInputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      paddingX: 'sm',
      paddingY: 'sm',
      fontSize: 'base',
      color: 'inputText',
    },
    componentSurface: config.slots?.phoneInput as Record<string, unknown> | undefined,
    activeStates,
  })
  const helperTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginTop: 'xs',
    },
    componentSurface: config.slots?.helperText as Record<string, unknown> | undefined,
    activeStates,
  })
  const errorTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'error',
      marginTop: 'xs',
    },
    componentSurface: config.slots?.errorText as Record<string, unknown> | undefined,
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
  const pickerPanelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderTopLeftRadius: 'xl',
      borderTopRightRadius: 'xl',
      shadow: 'lg',
      maxHeight: '70%',
      paddingBottom: Platform.OS === 'android' ? tokens.spacing[4] : 0,
    },
    componentSurface: config.slots?.pickerPanel as Record<string, unknown> | undefined,
    activeStates,
  })
  const pickerHeaderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingX: 'lg',
      paddingTop: 'lg',
      paddingBottom: 'sm',
    },
    componentSurface: config.slots?.pickerHeader as Record<string, unknown> | undefined,
    activeStates,
  })
  const pickerTitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
    },
    componentSurface: config.slots?.pickerTitle as Record<string, unknown> | undefined,
    activeStates,
  })
  const pickerCloseButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'xs',
    },
    componentSurface: config.slots?.pickerCloseButton as Record<string, unknown> | undefined,
    activeStates,
  })
  const pickerCloseSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: 'muted',
    },
    componentSurface: config.slots?.pickerClose as Record<string, unknown> | undefined,
    activeStates,
  })
  const searchContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'lg',
      paddingBottom: 'sm',
    },
    componentSurface: config.slots?.searchContainer as Record<string, unknown> | undefined,
    activeStates,
  })
  const searchInputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'muted',
      borderRadius: 'md',
      paddingX: 'sm',
      paddingY: 'xs',
      fontSize: 'base',
      color: 'inputText',
      border: '1px solid border',
    },
    componentSurface: config.slots?.searchInput as Record<string, unknown> | undefined,
    activeStates,
  })
  const countryListSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexGrow: 0,
    },
    componentSurface: config.slots?.countryList as Record<string, unknown> | undefined,
    activeStates,
  })
  const emptyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
      textAlign: 'center',
      paddingY: 'xl',
    },
    componentSurface: config.slots?.emptyText as Record<string, unknown> | undefined,
    activeStates,
  })

  const handleNumberChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^\d\s\-()]/g, '')
      setNumber(cleaned)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.onChangeAction, dispatch],
  )

  const handleCountrySelect = useCallback((selected: CountryData) => {
    setCountry(selected)
    setPickerVisible(false)
    setSearchText('')
  }, [])

  const handlePickerClose = useCallback(() => {
    setPickerVisible(false)
    setSearchText('')
  }, [])

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

        <View style={inputRowSurface.style as ViewStyle | undefined}>
          <TouchableOpacity
            style={countryButtonSurface.style as ViewStyle | undefined}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.dialCode}, ${country.name}`}
            accessibilityHint="Opens country code picker"
            testID={`${config.testID ?? config.id}-country`}
          >
            <Text
              style={{
                ...sharedTextStyle,
                ...(countryFlagSurface.style as TextStyle | undefined),
              }}
            >
              {country.flag}
            </Text>
            <Text
              style={{
                ...sharedTextStyle,
                ...(countryDialCodeSurface.style as TextStyle | undefined),
              }}
            >
              {country.dialCode}
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

          <View style={dividerSurface.style as ViewStyle | undefined} />

          <TextInput
            style={{
              ...sharedTextStyle,
              ...(phoneInputSurface.style as TextStyle | undefined),
            }}
            value={number}
            onChangeText={handleNumberChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={config.placeholder}
            placeholderTextColor={tokens.colors.inputPlaceholder}
            keyboardType="phone-pad"
            autoCapitalize="none"
            accessibilityLabel={config.label ?? 'Phone number'}
            testID={`${config.testID ?? config.id}-number`}
          />
        </View>

        {hasError ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(errorTextSurface.style as TextStyle | undefined),
            }}
            accessibilityLiveRegion="polite"
          >
            {config.errorText}
          </Text>
        ) : config.helperText ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(helperTextSurface.style as TextStyle | undefined),
            }}
          >
            {config.helperText}
          </Text>
        ) : null}

        <Modal
          visible={pickerVisible}
          transparent
          animationType="slide"
          onRequestClose={handlePickerClose}
          accessibilityViewIsModal
        >
          <TouchableOpacity
            style={backdropSurface.style as ViewStyle | undefined}
            onPress={handlePickerClose}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close country picker"
          >
            <SafeAreaView style={pickerPanelSurface.style as ViewStyle | undefined}>
              <TouchableOpacity activeOpacity={1}>
                <View style={pickerHeaderSurface.style as ViewStyle | undefined}>
                  <Text
                    style={{
                      ...sharedTextStyle,
                      ...(pickerTitleSurface.style as TextStyle | undefined),
                    }}
                  >
                    Select Country
                  </Text>
                  <TouchableOpacity
                    style={pickerCloseButtonSurface.style as ViewStyle | undefined}
                    onPress={handlePickerClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    testID={`${config.id}-picker-close`}
                  >
                    <Text
                      style={{
                        ...sharedTextStyle,
                        ...(pickerCloseSurface.style as TextStyle | undefined),
                      }}
                    >
                      X
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={searchContainerSurface.style as ViewStyle | undefined}>
                  <TextInput
                    style={{
                      ...sharedTextStyle,
                      ...(searchInputSurface.style as TextStyle | undefined),
                    }}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search countries..."
                    placeholderTextColor={tokens.colors.inputPlaceholder}
                    accessibilityRole="search"
                    accessibilityLabel="Search countries"
                    testID={`${config.id}-search`}
                    autoFocus
                  />
                </View>

                <FlatList<CountryData>
                  data={filteredCountries}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }) => {
                    const selected = item.code === country.code
                    const rowStates: RuntimeSurfaceState[] | undefined = [
                      ...(selected ? (['selected'] as const) : []),
                    ]
                    const countryRowSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingY: 'sm',
                        paddingX: 'lg',
                        gap: 'md',
                        states: {
                          selected: {
                            bg: 'muted',
                          },
                        },
                      },
                      componentSurface: config.slots?.countryRow as Record<string, unknown> | undefined,
                      activeStates: rowStates,
                    })
                    const countryRowFlagSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        fontSize: 'lg',
                        width: 28,
                      },
                      componentSurface: config.slots?.countryRowFlag as Record<string, unknown> | undefined,
                      activeStates: rowStates,
                    })
                    const countryRowNameSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        flex: 1,
                        fontSize: 'base',
                        color: selected ? 'primary' : 'foreground',
                        fontWeight: selected ? 'semibold' : 'regular',
                      },
                      componentSurface: config.slots?.countryRowName as Record<string, unknown> | undefined,
                      activeStates: rowStates,
                    })
                    const countryRowDialSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        fontSize: 'sm',
                        color: 'muted',
                        minWidth: 48,
                        textAlign: 'right',
                      },
                      componentSurface: config.slots?.countryRowDial as Record<string, unknown> | undefined,
                      activeStates: rowStates,
                    })
                    const checkmarkSurface = resolveSurfacePresentation({
                      tokens,
                      implementationBase: {
                        fontSize: 'base',
                        color: 'primary',
                      },
                      componentSurface: config.slots?.checkmark as Record<string, unknown> | undefined,
                      activeStates: rowStates,
                    })

                    return (
                      <TouchableOpacity
                        style={countryRowSurface.style as ViewStyle | undefined}
                        onPress={() => handleCountrySelect(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.name} ${item.dialCode}`}
                        accessibilityState={{ selected }}
                        testID={`${config.id}-country-${item.code}`}
                      >
                        <Text
                          style={{
                            ...sharedTextStyle,
                            ...(countryRowFlagSurface.style as TextStyle | undefined),
                          }}
                        >
                          {item.flag}
                        </Text>
                        <Text
                          style={{
                            ...sharedTextStyle,
                            ...(countryRowNameSurface.style as TextStyle | undefined),
                          }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={{
                            ...sharedTextStyle,
                            ...(countryRowDialSurface.style as TextStyle | undefined),
                          }}
                        >
                          {item.dialCode}
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
                  ListEmptyComponent={
                    <Text
                      style={{
                        ...sharedTextStyle,
                        ...(emptyTextSurface.style as TextStyle | undefined),
                      }}
                    >
                      No countries found
                    </Text>
                  }
                  style={countryListSurface.style as ViewStyle | undefined}
                  keyboardShouldPersistTaps="handled"
                />
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>
      </View>
    </ComponentWrapper>
  )
}
