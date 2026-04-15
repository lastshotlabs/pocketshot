import type { DimensionValue } from 'react-native'

export function toNativeDimensionValue(value: unknown): DimensionValue | undefined {
  if (typeof value === 'number') {
    return value
  }

  if (value === 'auto') {
    return 'auto'
  }

  if (typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value.trim())) {
    return value.trim() as `${number}%`
  }

  return undefined
}

export function toNumericDimensionValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}
