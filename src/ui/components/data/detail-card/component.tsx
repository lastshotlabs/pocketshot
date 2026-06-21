import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { DetailCardBase, type DetailCardSection } from './standalone'
import type { DetailCardConfig } from './types'

export function DetailCard({ config }: { config: DetailCardConfig }) {
  const { dispatch, values } = useScreenContext()

  const isLoading: boolean = isFromRef(config.loading)
    ? Boolean(resolveFromRef(config.loading, values))
    : ((config.loading as boolean | undefined) ?? false)
  const resolvedTitle =
    config.title == null
      ? undefined
      : isFromRef(config.title)
        ? String(resolveFromRef(config.title, values) ?? '')
        : config.title
  const resolvedSubtitle =
    config.subtitle == null
      ? undefined
      : isFromRef(config.subtitle)
        ? String(resolveFromRef(config.subtitle, values) ?? '')
        : config.subtitle

  const resolvedSections: DetailCardSection[] = useMemo(
    () =>
      config.sections.map((section) => ({
        title: section.title,
        fields: section.fields.map((field) => {
          const rawValue: string | undefined = isFromRef(field.value)
            ? (() => {
                const resolved = resolveFromRef(field.value, values)
                return resolved == null ? undefined : String(resolved)
              })()
            : typeof field.value === 'string'
              ? field.value
              : undefined
          return {
            label: field.label,
            value: rawValue,
            type: field.type,
            slots: field.slots as Record<string, Record<string, unknown>> | undefined,
          }
        }),
      })),
    [config.sections, values],
  )

  const handleOpenUrl = useCallback(
    (url: string) => {
      void dispatch({ type: 'open-url', url })
    },
    [dispatch],
  )

  const handleEditPress = useCallback(async () => {
    if (!config.onEditPress) return
    await dispatch(config.onEditPress)
  }, [config.onEditPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <DetailCardBase
        title={resolvedTitle}
        subtitle={resolvedSubtitle}
        loading={isLoading}
        sections={resolvedSections}
        onEditPress={config.onEditPress ? () => void handleEditPress() : undefined}
        onLinkPress={handleOpenUrl}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
