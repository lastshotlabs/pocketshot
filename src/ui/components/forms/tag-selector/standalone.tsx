import React, { useState } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface TagDefinition {
  id: string
  label: string
  color?: string
}

export interface TagSelectorBaseProps {
  /** Tags available for selection. */
  availableTags: TagDefinition[]
  /** Controlled selected tag IDs. */
  value?: string[]
  /** Initial selected IDs when uncontrolled. */
  defaultValue?: string[]
  /** Called whenever the selection changes. */
  onChange?: (ids: string[]) => void
  /** Visible group label. */
  label?: string
  /** Cap on number of tags. Extra tags become disabled when limit is reached. */
  maxTags?: number
  /** Slot overrides (container, label, tagsRow, tag, tagText). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

interface TagChipProps {
  tag: TagDefinition
  selected: boolean
  dimmed: boolean
  onPress: (id: string) => void
  componentId: string
  slots: TagSelectorBaseProps['slots']
  sharedTextStyle: TextStyle
}

function TagChip({
  tag,
  selected,
  dimmed,
  onPress,
  componentId,
  slots,
  sharedTextStyle,
}: TagChipProps) {
  const tokens = useTokens()
  const activeStates: RuntimeSurfaceState[] = [
    ...(selected ? (['selected'] as const) : []),
    ...(dimmed ? (['disabled'] as const) : []),
  ]
  const tagSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: 'full',
      paddingY: 5,
      paddingX: 10,
      border: selected ? '1px solid primary' : '1px solid border',
      bg: selected ? 'primary' : 'muted',
      opacity: dimmed ? 0.4 : 1,
      states: { disabled: { opacity: 0.4 } },
    },
    componentSurface: slots?.tag,
    activeStates,
  })
  const tagTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: selected ? 'primary-foreground' : 'muted',
    },
    componentSurface: slots?.tagText,
    activeStates,
  })
  const customColorStyle =
    selected && tag.color != null
      ? { backgroundColor: tag.color, borderColor: tag.color }
      : undefined

  return (
    <TouchableOpacity
      style={{ ...(tagSurface.style as ViewStyle | undefined), ...customColorStyle }}
      onPress={() => onPress(tag.id)}
      disabled={dimmed}
      accessibilityRole="checkbox"
      accessibilityLabel={tag.label}
      accessibilityState={{ checked: selected, disabled: dimmed }}
      testID={`${componentId}-tag-${tag.id}`}
    >
      <Text
        style={{
          ...sharedTextStyle,
          ...(tagTextSurface.style as TextStyle | undefined),
        }}
      >
        {tag.label}
      </Text>
    </TouchableOpacity>
  )
}

/**
 * Standalone TagSelector — pickable tag chips with optional max selection.
 *
 * @example
 * <TagSelectorBase
 *   availableTags={[{id:'a',label:'A'},{id:'b',label:'B'}]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 */
export function TagSelectorBase({
  availableTags,
  value,
  defaultValue,
  onChange,
  label,
  maxTags,
  slots,
  style,
  testID,
  id,
}: TagSelectorBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<string[]>(defaultValue ?? [])
  const isControlled = value !== undefined
  const selectedIds = isControlled ? (value ?? []) : internal

  const atLimit = maxTags != null && selectedIds.length >= maxTags
  const activeStates: RuntimeSurfaceState[] | undefined =
    selectedIds.length > 0 ? ['selected'] : undefined

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: slots?.container,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: slots?.label,
    activeStates,
  })
  const tagsRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 'sm',
    },
    componentSurface: slots?.tagsRow,
    activeStates,
  })

  function handlePress(tagId: string) {
    const isSelected = selectedIds.includes(tagId)
    if (!isSelected && atLimit) return
    const next = isSelected
      ? selectedIds.filter((entry) => entry !== tagId)
      : [...selectedIds, tagId]
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  const componentId = id ?? testID ?? 'tag-selector'

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]}>
      {label != null ? (
        <Text
          style={{ ...sharedTextStyle, ...(labelSurface.style as TextStyle | undefined) }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}
      <View style={tagsRowSurface.style as ViewStyle | undefined}>
        {availableTags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            selected={selectedIds.includes(tag.id)}
            dimmed={!selectedIds.includes(tag.id) && Boolean(atLimit)}
            onPress={handlePress}
            componentId={componentId}
            slots={slots}
            sharedTextStyle={sharedTextStyle}
          />
        ))}
      </View>
    </View>
  )
}
