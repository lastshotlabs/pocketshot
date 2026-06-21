import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface LocationValue {
  latitude: number
  longitude: number
  address?: string
}

interface ExpoLocationModule {
  requestForegroundPermissionsAsync(): Promise<{ status: string }>
  getCurrentPositionAsync(options?: { accuracy?: number }): Promise<{
    coords: { latitude: number; longitude: number }
  }>
  reverseGeocodeAsync(location: { latitude: number; longitude: number }): Promise<
    Array<{ street?: string; city?: string; region?: string; country?: string }>
  >
}

let _expoLocationCache: ExpoLocationModule | null | undefined

function tryExpoLocation(): ExpoLocationModule | null {
  if (_expoLocationCache !== undefined) return _expoLocationCache
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _expoLocationCache = require('expo-location') as ExpoLocationModule
  } catch {
    _expoLocationCache = null
  }
  return _expoLocationCache
}

interface RNMapsModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: React.ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Marker: React.ComponentType<any>
}

let _rnMapsCache: RNMapsModule | null | undefined

function tryRNMaps(): RNMapsModule | null {
  if (_rnMapsCache !== undefined) return _rnMapsCache
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _rnMapsCache = require('react-native-maps') as RNMapsModule
  } catch {
    _rnMapsCache = null
  }
  return _rnMapsCache
}

interface MapPreviewProps {
  location: LocationValue
  tokens: DesignTokens
  testIDPrefix: string
}

function MapPreview({ location, tokens, testIDPrefix }: MapPreviewProps) {
  const styles = useMemo(() => makePreviewStyles(tokens), [tokens])
  const maps = tryRNMaps()

  if (maps) {
    const MapView = maps.default
    const { Marker } = maps
    return (
      <View style={styles.mapContainer} testID={`${testIDPrefix}-map`}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          />
        </MapView>
      </View>
    )
  }

  return (
    <View
      style={styles.coordContainer}
      testID={`${testIDPrefix}-coords`}
      accessibilityRole="text"
      accessibilityLabel={`Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
    >
      <Text style={styles.coordIcon}>📍</Text>
      <View style={styles.coordTextContainer}>
        <Text style={styles.coordLabel}>Coordinates</Text>
        <Text style={styles.coordValue}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
        {location.address ? (
          <Text style={styles.coordAddress} numberOfLines={2}>
            {location.address}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export interface LocationInputBaseProps {
  /** Initial location. */
  defaultValue?: LocationValue | null
  /** Called whenever the location updates (text edit or geolocation). */
  onChange?: (value: LocationValue | null) => void
  /** Visible label. */
  label?: string
  /** Placeholder for the address input. */
  placeholder?: string
  /** Show the map / coordinates preview when a location is set. */
  showPreview?: boolean
  /** Style applied to root. */
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone LocationInput — address text input + "use current location" + optional map preview.
 *
 * @example
 * <LocationInputBase label="Where" onChange={setLocation} />
 */
export function LocationInputBase({
  defaultValue,
  onChange,
  label,
  placeholder,
  showPreview = true,
  style,
  testID,
  id,
}: LocationInputBaseProps) {
  const tokens = useTokens()
  const [location, setLocation] = useState<LocationValue | null>(defaultValue ?? null)
  const [addressText, setAddressText] = useState(defaultValue?.address ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const testIDBase = testID ?? id

  const publish = useCallback(
    (next: LocationValue | null) => {
      onChange?.(next)
    },
    [onChange],
  )

  const handleAddressChange = useCallback(
    (text: string) => {
      setAddressText(text)
      if (location) {
        const next = { ...location, address: text }
        setLocation(next)
        publish(next)
      } else {
        publish(null)
      }
    },
    [location, publish],
  )

  const handleUseCurrentLocation = useCallback(async () => {
    const expoLocation = tryExpoLocation()
    if (!expoLocation) {
      setError('Location services are not available. Install expo-location to enable this feature.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { status } = await expoLocation.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location permission was denied')
        setLoading(false)
        return
      }

      const position = await expoLocation.getCurrentPositionAsync({})
      const { latitude, longitude } = position.coords

      let address: string | undefined
      try {
        const results = await expoLocation.reverseGeocodeAsync({ latitude, longitude })
        if (results.length > 0) {
          const r = results[0]
          const parts = [r.street, r.city, r.region, r.country].filter(Boolean)
          address = parts.join(', ')
        }
      } catch {
        // best-effort
      }

      const next: LocationValue = { latitude, longitude, address }
      setLocation(next)
      setAddressText(address ?? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      publish(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location')
    } finally {
      setLoading(false)
    }
  }, [publish])

  return (
    <View style={[styles.container, style]}>
      {label != null ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <TextInput
        style={styles.input}
        value={addressText}
        onChangeText={handleAddressChange}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        accessibilityLabel={label ?? 'Location address'}
        testID={testIDBase ? `${testIDBase}-address` : undefined}
      />

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Use current location"
        accessibilityState={{ busy: loading }}
        testID={testIDBase ? `${testIDBase}-current` : undefined}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={tokens.colors.primary}
            accessibilityLabel="Getting location"
          />
        ) : (
          <Text style={styles.currentLocationIcon}>📍</Text>
        )}
        <Text style={styles.currentLocationText}>
          {loading ? 'Getting location...' : 'Use Current Location'}
        </Text>
      </TouchableOpacity>

      {error != null && (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}

      {showPreview && location != null && (
        <MapPreview
          location={location}
          tokens={tokens}
          testIDPrefix={testIDBase ?? 'location-input'}
        />
      )}
    </View>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: { gap: tokens.spacing[2] },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    input: {
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      minHeight: 48,
    },
    currentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
      paddingVertical: tokens.spacing[2],
      paddingHorizontal: tokens.spacing[3],
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
    },
    currentLocationIcon: { fontSize: tokens.typography.fontSizeMd },
    currentLocationText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
    errorText: { fontSize: tokens.typography.fontSizeXs, color: tokens.colors.error },
  })
}

function makePreviewStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    mapContainer: {
      height: 160,
      borderRadius: tokens.radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    map: { flex: 1 },
    coordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.md,
      padding: tokens.spacing[3],
      gap: tokens.spacing[3],
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    coordIcon: { fontSize: tokens.typography.fontSizeXl },
    coordTextContainer: { flex: 1 },
    coordLabel: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    coordValue: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginTop: tokens.spacing[1],
    },
    coordAddress: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },
  })
}
