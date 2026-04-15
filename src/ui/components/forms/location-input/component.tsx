import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { LocationInputConfig, LocationValue } from './types'

// ── Optional dependency loaders ───────────────────────────────────────────────

interface ExpoLocationModule {
  requestForegroundPermissionsAsync(): Promise<{ status: string }>
  getCurrentPositionAsync(options?: { accuracy?: number }): Promise<{
    coords: { latitude: number; longitude: number }
  }>
  reverseGeocodeAsync(location: {
    latitude: number
    longitude: number
  }): Promise<Array<{ street?: string; city?: string; region?: string; country?: string }>>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ── Map Preview ───────────────────────────────────────────────────────────────

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
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
          />
        </MapView>
      </View>
    )
  }

  // Fallback: coordinate display
  return (
    <View
      style={styles.coordContainer}
      testID={`${testIDPrefix}-coords`}
      accessibilityRole="text"
      accessibilityLabel={`Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
    >
      <Text style={styles.coordIcon}>{'\uD83D\uDCCD'}</Text>
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

// ── Main Component ────────────────────────────────────────────────────────────

export function LocationInput({ config }: { config: LocationInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedDefault =
    config.defaultValue != null
      ? resolveFromRef<LocationValue>(config.defaultValue, values)
      : undefined

  const [location, setLocation] = useState<LocationValue | null>(resolvedDefault ?? null)
  const [addressText, setAddressText] = useState(resolvedDefault?.address ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const showPreview = config.showPreview ?? true

  // Publish value
  useEffect(() => {
    if (location) {
      setValue(config.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address ?? addressText,
      })
    } else {
      setValue(config.id, null)
    }
  }, [config.id, location, addressText, setValue])

  const handleAddressChange = useCallback(
    (text: string) => {
      setAddressText(text)
      if (location) {
        setLocation({ ...location, address: text })
      }
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [location, config.onChangeAction, dispatch],
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
        // Reverse geocoding is best-effort
      }

      const newLocation: LocationValue = { latitude, longitude, address }
      setLocation(newLocation)
      setAddressText(address ?? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)

      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location')
    } finally {
      setLoading(false)
    }
  }, [config.onChangeAction, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}

        <TextInput
          style={styles.input}
          value={addressText}
          onChangeText={handleAddressChange}
          placeholder={config.placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          accessibilityLabel={config.label ?? 'Location address'}
          testID={`${config.testID ?? config.id}-address`}
        />

        {/* Use Current Location button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Use current location"
          accessibilityState={{ busy: loading }}
          testID={`${config.testID ?? config.id}-current`}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={tokens.colors.primary}
              accessibilityLabel="Getting location"
            />
          ) : (
            <Text style={styles.currentLocationIcon}>{'\uD83D\uDCCD'}</Text>
          )}
          <Text style={styles.currentLocationText}>
            {loading ? 'Getting location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Error message */}
        {error != null && (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        {/* Map preview */}
        {showPreview && location != null && (
          <MapPreview
            location={location}
            tokens={tokens}
            testIDPrefix={config.testID ?? config.id}
          />
        )}
      </View>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens) {
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
    currentLocationIcon: {
      fontSize: tokens.typography.fontSizeMd,
    },
    currentLocationText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
    },
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
    map: {
      flex: 1,
    },
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
    coordIcon: {
      fontSize: tokens.typography.fontSizeXl,
    },
    coordTextContainer: {
      flex: 1,
    },
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

