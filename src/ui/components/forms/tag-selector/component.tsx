import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { TagSelectorConfig, TagDefinition } from './types'

interface TagChipProps {
  tag: TagDefinition
  selected: boolean
  dimmed: boolean
  onPress: (id: string) => void
  componentId: string
  slots: TagSelectorConfig['slots']
  sharedTextStyle: TextStyle
}

function TagChip({ tag, selected, dimmed, onPress, componentId, slots, sharedTextStyle }: TagChipProps) {
  const tokens = useTokens()
  const handlePress = useCallback(() => {
    onPress(tag.id)
  }, [onPress, tag.id])

  const activeStates: RuntimeSurfaceState[] | undefined = [
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
      states: {
        disabled: {
          opacity: 0.4,
        },
      },
    },
    componentSurface: slots?.tag as Record<string, unknown> | undefined,
    activeStates,
  })
  const tagTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: selected ? 'primary-foreground' : 'muted',
    },
    componentSurface: slots?.tagText as Record<string, unknown> | undefined,
    activeStates,
  })
  const customColorStyle =
    selected && tag.color != null
      ? {
          backgroundColor: tag.color,
          borderColor: tag.color,
        }
      : undefined

  return (
    <TouchableOpacity
      style={{
        ...(tagSurface.style as ViewStyle | undefined),
        ...customColorStyle,
      }}
      onPress={handlePress}
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

export function TagSelector({ config }: { config: TagSelectorConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string[] | undefined) : undefined

  const [selectedIds, setSelectedIds] = useState<string[]>(resolvedValue ?? config.defaultValue ?? [])
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    if (resolvedValue != null) {
      setSelectedIds(resolvedValue)
    }
  }, [resolvedValue])

  const atLimit = config.maxTags != null && selectedIds.length >= config.maxTags
  const activeStates: RuntimeSurfaceState[] | undefined = selectedIds.length > 0 ? ['selected'] : undefined

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })
  const tagsRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 'sm',
    },
    componentSurface: config.slots?.tagsRow as Record<string, unknown> | undefined,
    activeStates,
  })

  const handleTagPress = useCallback(
    (tagId: string) => {
      const isSelected = selectedIds.includes(tagId)
      if (!isSelected && atLimit) return
      const nextIds = isSelected ? selectedIds.filter((id) => id !== tagId) : [...selectedIds, tagId]
      setSelectedIds(nextIds)
      setValue(config.id, nextIds)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [atLimit, config.id, config.onChangeAction, dispatch, selectedIds, setValue],
  )

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
        <View style={tagsRowSurface.style as ViewStyle | undefined}>
          {config.availableTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={selectedIds.includes(tag.id)}
              dimmed={!selectedIds.includes(tag.id) && atLimit}
              onPress={handleTagPress}
              componentId={config.id}
              slots={config.slots}
              sharedTextStyle={sharedTextStyle}
            />
          ))}
        </View>
      </View>
    </ComponentWrapper>
  )
}
