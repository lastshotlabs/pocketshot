import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface CountryData {
  code: string
  name: string
  dialCode: string
  flag: string
}

export interface PhoneInputValue {
  countryCode: string
  dialCode: string
  number: string
  formatted: string
}

const COUNTRIES: CountryData[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
]

function findCountry(code: string): CountryData {
  return COUNTRIES.find((country) => country.code === code) ?? COUNTRIES[0]
}

export interface PhoneInputBaseProps {
  /** ISO country code for the default selected country. */
  defaultCountry?: string
  /** Initial phone number. */
  defaultNumber?: string
  /** Called when the value changes. */
  onChange?: (value: PhoneInputValue) => void
  /** Visible label. */
  label?: string
  /** Placeholder for the number input. */
  placeholder?: string
  /** Helper text shown when no error. */
  helperText?: string
  /** Error message — switches to invalid state. */
  errorText?: string
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone PhoneInput — international phone number entry with country picker.
 *
 * @example
 * <PhoneInputBase label="Phone" onChange={(v) => setValue(v.formatted)} />
 */
export function PhoneInputBase({
  defaultCountry = 'US',
  defaultNumber = '',
  onChange,
  label,
  placeholder,
  helperText,
  errorText,
  slots,
  style,
  testID,
  id,
}: PhoneInputBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const [country, setCountry] = useState<CountryData>(() => findCountry(defaultCountry))
  const [number, setNumber] = useState(defaultNumber)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [focused, setFocused] = useState(false)

  const filteredCountries = useMemo(() => {
    if (!searchText.trim()) return COUNTRIES
    const lower = searchText.toLowerCase()
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.code.toLowerCase().includes(lower) ||
        item.dialCode.includes(searchText),
    )
  }, [searchText])

  const hasError = errorText != null
  const activeStates: RuntimeSurfaceState[] = [
    ...(focused ? (['focus'] as const) : []),
    ...(hasError ? (['invalid'] as const) : []),
    ...(pickerVisible ? (['open'] as const) : []),
  ]
  const testIDBase = testID ?? id

  function publish(nextCountry: CountryData, nextNumber: string) {
    onChange?.({
      countryCode: nextCountry.code,
      dialCode: nextCountry.dialCode,
      number: nextNumber,
      formatted: nextNumber ? `${nextCountry.dialCode} ${nextNumber}` : '',
    })
  }

  const handleNumberChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^\d\s\-()]/g, '')
      setNumber(cleaned)
      publish(country, cleaned)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [country],
  )

  const handleCountrySelect = useCallback(
    (selected: CountryData) => {
      setCountry(selected)
      setPickerVisible(false)
      setSearchText('')
      publish(selected, number)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [number],
  )

  const handlePickerClose = useCallback(() => {
    setPickerVisible(false)
    setSearchText('')
  }, [])

  function resolveSlot(slot: string, base?: Record<string, unknown>) {
    return resolveSurfacePresentation({
      tokens,
      implementationBase: base,
      componentSurface: slots?.[slot],
      activeStates,
    })
  }

  function mergeText(surface: ReturnType<typeof resolveSurfacePresentation>): TextStyle {
    return { ...sharedTextStyle, ...(surface.style as TextStyle | undefined) }
  }

  const containerSurface = resolveSlot('container', { gap: 'xs' })
  const labelSurface = resolveSlot('label', {
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'foreground',
    marginBottom: 'xs',
  })
  const inputRowSurface = resolveSlot('inputRow', {
    flexDirection: 'row',
    alignItems: 'center',
    bg: 'inputBackground',
    border: hasError
      ? '1px solid error'
      : focused
        ? '1px solid borderFocus'
        : '1px solid inputBorder',
    borderRadius: 'md',
    minHeight: 48,
    states: {
      focus: { border: '1px solid borderFocus' },
      invalid: { border: '1px solid error' },
    },
  })
  const countryButtonSurface = resolveSlot('countryButton', {
    flexDirection: 'row',
    alignItems: 'center',
    paddingX: 'sm',
    paddingY: 'xs',
    gap: 'xs',
  })
  const countryFlagSurface = resolveSlot('countryFlag', { fontSize: 'lg' })
  const countryDialCodeSurface = resolveSlot('countryDialCode', {
    fontSize: 'base',
    fontWeight: 'medium',
    color: 'foreground',
  })
  const chevronSurface = resolveSlot('chevron', { fontSize: 'xs', color: 'muted' })
  const dividerSurface = resolveSlot('divider', { width: 1, height: 24, bg: 'border' })
  const phoneInputSurface = resolveSlot('phoneInput', {
    flex: 1,
    paddingX: 'sm',
    paddingY: 'sm',
    fontSize: 'base',
    color: 'inputText',
  })
  const helperTextSurface = resolveSlot('helperText', {
    fontSize: 'xs',
    color: 'muted',
    marginTop: 'xs',
  })
  const errorTextSurface = resolveSlot('errorText', {
    fontSize: 'xs',
    color: 'error',
    marginTop: 'xs',
  })
  const backdropSurface = resolveSlot('backdrop', {
    flex: 1,
    bg: 'overlay',
    justifyContent: 'end',
    opacity: 0.8,
  })
  const pickerPanelSurface = resolveSlot('pickerPanel', {
    bg: 'card',
    borderTopLeftRadius: 'xl',
    borderTopRightRadius: 'xl',
    shadow: 'lg',
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'android' ? tokens.spacing[4] : 0,
  })
  const pickerHeaderSurface = resolveSlot('pickerHeader', {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingX: 'lg',
    paddingTop: 'lg',
    paddingBottom: 'sm',
  })
  const pickerTitleSurface = resolveSlot('pickerTitle', {
    fontSize: 'lg',
    fontWeight: 'semibold',
    color: 'foreground',
  })
  const pickerCloseButtonSurface = resolveSlot('pickerCloseButton', { padding: 'xs' })
  const pickerCloseSurface = resolveSlot('pickerClose', { fontSize: 'lg', color: 'muted' })
  const searchContainerSurface = resolveSlot('searchContainer', {
    paddingX: 'lg',
    paddingBottom: 'sm',
  })
  const searchInputSurface = resolveSlot('searchInput', {
    bg: 'muted',
    borderRadius: 'md',
    paddingX: 'sm',
    paddingY: 'xs',
    fontSize: 'base',
    color: 'inputText',
    border: '1px solid border',
  })
  const countryListSurface = resolveSlot('countryList', { flexGrow: 0 })
  const emptyTextSurface = resolveSlot('emptyText', {
    fontSize: 'base',
    color: 'muted',
    textAlign: 'center',
    paddingY: 'xl',
  })

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]}>
      {label != null ? (
        <Text style={mergeText(labelSurface)} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <View style={inputRowSurface.style as ViewStyle | undefined}>
        <TouchableOpacity
          style={countryButtonSurface.style as ViewStyle | undefined}
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Country code ${country.dialCode}, ${country.name}`}
          accessibilityHint="Opens country code picker"
          testID={testIDBase ? `${testIDBase}-country` : undefined}
        >
          <Text style={mergeText(countryFlagSurface)}>{country.flag}</Text>
          <Text style={mergeText(countryDialCodeSurface)}>{country.dialCode}</Text>
          <Text style={mergeText(chevronSurface)}>▾</Text>
        </TouchableOpacity>

        <View style={dividerSurface.style as ViewStyle | undefined} />

        <TextInput
          style={mergeText(phoneInputSurface)}
          value={number}
          onChangeText={handleNumberChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          keyboardType="phone-pad"
          autoCapitalize="none"
          accessibilityLabel={label ?? 'Phone number'}
          testID={testIDBase ? `${testIDBase}-number` : undefined}
        />
      </View>

      {hasError ? (
        <Text style={mergeText(errorTextSurface)} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={mergeText(helperTextSurface)}>{helperText}</Text>
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
            <TouchableOpacity activeOpacity={1} accessible={false}>
              <View style={pickerHeaderSurface.style as ViewStyle | undefined}>
                <Text style={mergeText(pickerTitleSurface)}>Select Country</Text>
                <TouchableOpacity
                  style={pickerCloseButtonSurface.style as ViewStyle | undefined}
                  onPress={handlePickerClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  testID={testIDBase ? `${testIDBase}-picker-close` : undefined}
                >
                  <Text style={mergeText(pickerCloseSurface)}>X</Text>
                </TouchableOpacity>
              </View>

              <View style={searchContainerSurface.style as ViewStyle | undefined}>
                <TextInput
                  style={mergeText(searchInputSurface)}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search countries..."
                  placeholderTextColor={tokens.colors.inputPlaceholder}
                  accessibilityRole="search"
                  accessibilityLabel="Search countries"
                  testID={testIDBase ? `${testIDBase}-search` : undefined}
                  autoFocus
                />
              </View>

              <FlatList<CountryData>
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => {
                  const selected = item.code === country.code
                  const rowStates: RuntimeSurfaceState[] = selected ? ['selected'] : []
                  const countryRowSurface = resolveSurfacePresentation({
                    tokens,
                    implementationBase: {
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingY: 'sm',
                      paddingX: 'lg',
                      gap: 'md',
                      states: { selected: { bg: 'muted' } },
                    },
                    componentSurface: slots?.countryRow,
                    activeStates: rowStates,
                  })
                  const countryRowFlagSurface = resolveSurfacePresentation({
                    tokens,
                    implementationBase: { fontSize: 'lg', width: 28 },
                    componentSurface: slots?.countryRowFlag,
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
                    componentSurface: slots?.countryRowName,
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
                    componentSurface: slots?.countryRowDial,
                    activeStates: rowStates,
                  })
                  const checkmarkSurface = resolveSurfacePresentation({
                    tokens,
                    implementationBase: { fontSize: 'base', color: 'primary' },
                    componentSurface: slots?.checkmark,
                    activeStates: rowStates,
                  })

                  return (
                    <TouchableOpacity
                      style={countryRowSurface.style as ViewStyle | undefined}
                      onPress={() => handleCountrySelect(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name} ${item.dialCode}`}
                      accessibilityState={{ selected }}
                      testID={testIDBase ? `${testIDBase}-country-${item.code}` : undefined}
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
                          ✓
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={
                  <Text style={mergeText(emptyTextSurface)}>No countries found</Text>
                }
                style={countryListSurface.style as ViewStyle | undefined}
                keyboardShouldPersistTaps="handled"
              />
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
