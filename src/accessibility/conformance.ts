import type { MobilePlatform } from './mobile-shell'
import { minimumTouchTarget } from './mobile-shell'

export type AccessibilityViolationCode =
  | 'missing-label'
  | 'missing-role'
  | 'touch-target'
  | 'contrast'
  | 'invalid-state'

export interface AccessibilityNodeContract {
  id: string
  interactive: boolean
  decorative?: boolean
  role?: string | null
  label?: string | null
  width: number
  height: number
  disabled?: boolean
  foreground?: string
  background?: string
  largeText?: boolean
}

export interface AccessibilityViolation {
  nodeId: string
  code: AccessibilityViolationCode
  message: string
}

export function auditAccessibilityNode(
  node: AccessibilityNodeContract,
  platform: MobilePlatform,
): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = []
  if (!node.id.trim() || !Number.isFinite(node.width) || !Number.isFinite(node.height)) {
    violations.push({
      nodeId: node.id || 'unknown',
      code: 'invalid-state',
      message: 'Node identity and dimensions must be valid',
    })
    return violations
  }
  if (node.interactive && !node.decorative) {
    if (!node.role?.trim()) {
      violations.push({ nodeId: node.id, code: 'missing-role', message: 'Interactive role is required' })
    }
    if (!node.label?.trim()) {
      violations.push({
        nodeId: node.id,
        code: 'missing-label',
        message: 'Interactive label is required',
      })
    }
    const minimum = minimumTouchTarget(platform)
    if (node.width < minimum || node.height < minimum) {
      violations.push({
        nodeId: node.id,
        code: 'touch-target',
        message: `Touch target must be at least ${minimum} by ${minimum}`,
      })
    }
  }
  if (node.foreground && node.background) {
    const ratio = contrastRatio(node.foreground, node.background)
    const required = node.largeText ? 3 : 4.5
    if (ratio < required) {
      violations.push({
        nodeId: node.id,
        code: 'contrast',
        message: `Contrast ${ratio.toFixed(2)} is below ${required.toFixed(1)}`,
      })
    }
  }
  return violations
}

export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(parseHexColor(foreground))
  const second = relativeLuminance(parseHexColor(background))
  const light = Math.max(first, second)
  const dark = Math.min(first, second)
  return (light + 0.05) / (dark + 0.05)
}

function parseHexColor(value: string): [number, number, number] {
  const match = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i.exec(value.trim())
  if (!match) throw new Error('Contrast colors must use #RGB or #RRGGBB')
  const hex = match[1]!
  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => character + character)
          .join('')
      : hex
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ]
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
}
