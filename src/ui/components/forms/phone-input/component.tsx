import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
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
import type { DesignTokens } from '../../../tokens/types'
import type { PhoneInputConfig, CountryData } from './types'

// ── Country Data ──────────────────────────────────────────────────────────────

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
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]
}

export function PhoneInput({ config }: { config: PhoneInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [country, setCountry] = useState<CountryData>(() =>
    findCountry(config.defaultCountry ?? 'US'),
  )
  const [number, setNumber] = useState('')
  const [pickerVisible, setPickerVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const filteredCountries = useMemo(() => {
    if (!searchText.trim()) return COUNTRIES
    const lower = searchText.toLowerCase()
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower) ||
        c.dialCode.includes(searchText),
    )
  }, [searchText])

  // Publish value to screen context
  useEffect(() => {
    const formatted = number ? `${country.dialCode} ${number}` : ''
    setValue(config.id, {
      countryCode: country.code,
      dialCode: country.dialCode,
      number,
      formatted,
    })
  }, [config.id, country, number, setValue])

  const handleNumberChange = useCallback(
    (text: string) => {
      // Allow only digits, spaces, dashes, and parentheses
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

  const hasError = config.errorText != null

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}

        <View style={[styles.inputRow, hasError && styles.inputRowError]}>
          {/* Country code button */}
          <TouchableOpacity
            style={styles.countryButton}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.dialCode}, ${country.name}`}
            accessibilityHint="Opens country code picker"
            testID={`${config.testID ?? config.id}-country`}
          >
            <Text style={styles.countryFlag}>{country.flag}</Text>
            <Text style={styles.countryDialCode}>{country.dialCode}</Text>
            <Text style={styles.chevron}>{'\u25BC'}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Phone number input */}
          <TextInput
            style={styles.phoneInput}
            value={number}
            onChangeText={handleNumberChange}
            placeholder={config.placeholder}
            placeholderTextColor={tokens.colors.inputPlaceholder}
            keyboardType="phone-pad"
            autoCapitalize="none"
            accessibilityLabel={config.label ?? 'Phone number'}
            testID={`${config.testID ?? config.id}-number`}
          />
        </View>

        {hasError ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {config.errorText}
          </Text>
        ) : config.helperText ? (
          <Text style={styles.helperText}>{config.helperText}</Text>
        ) : null}

        {/* Country picker modal */}
        <Modal
          visible={pickerVisible}
          transparent
          animationType="slide"
          onRequestClose={handlePickerClose}
          accessibilityViewIsModal
        >
          <TouchableOpacity
            style={styles.backdrop}
            onPress={handlePickerClose}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close country picker"
          >
            <SafeAreaView style={styles.pickerPanel}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Country</Text>
                  <TouchableOpacity
                    onPress={handlePickerClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    testID={`${config.id}-picker-close`}
                  >
                    <Text style={styles.pickerClose}>{'\u2715'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
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
                    const isSelected = item.code === country.code
                    return (
                      <TouchableOpacity
                        style={[styles.countryRow, isSelected && styles.countryRowSelected]}
                        onPress={() => handleCountrySelect(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.name} ${item.dialCode}`}
                        accessibilityState={{ selected: isSelected }}
                        testID={`${config.id}-country-${item.code}`}
                      >
                        <Text style={styles.countryRowFlag}>{item.flag}</Text>
                        <Text
                          style={[styles.countryRowName, isSelected && styles.countryRowNameSelected]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.countryRowDial}>{item.dialCode}</Text>
                        {isSelected ? <Text style={styles.checkmark}>{'\u2713'}</Text> : null}
                      </TouchableOpacity>
                    )
                  }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No countries found</Text>
                  }
                  style={styles.countryList}
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

function makeStyles(tokens: DesignTokens) {
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
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      minHeight: 48,
    },
    inputRowError: {
      borderColor: tokens.colors.error,
    },
    countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[1],
    },
    countryFlag: {
      fontSize: tokens.typography.fontSizeLg,
    },
    countryDialCode: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    chevron: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: tokens.colors.divider,
    },
    phoneInput: {
      flex: 1,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    helperText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
      marginTop: tokens.spacing[1],
    },
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay + 'CC',
      justifyContent: 'flex-end',
    },
    pickerPanel: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.xl,
      borderTopRightRadius: tokens.radius.xl,
      maxHeight: '70%',
      ...tokens.shadows.lg,
      ...Platform.select({
        android: { paddingBottom: tokens.spacing[4] },
      }),
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    pickerTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    pickerClose: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.textMuted,
      padding: tokens.spacing[1],
    },
    searchContainer: {
      paddingHorizontal: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    searchInput: {
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    countryList: {
      flexGrow: 0,
    },
    countryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[4],
      gap: tokens.spacing[3],
    },
    countryRowSelected: {
      backgroundColor: tokens.colors.surfaceAlt,
    },
    countryRowFlag: {
      fontSize: tokens.typography.fontSizeLg,
      width: 28,
    },
    countryRowName: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    countryRowNameSelected: {
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
    },
    countryRowDial: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      minWidth: 48,
      textAlign: 'right',
    },
    checkmark: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primary,
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      paddingVertical: tokens.spacing[6],
    },
  })
}

