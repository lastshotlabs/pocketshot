import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { AccordionBase, type AccordionVariant } from './standalone'
import type { AccordionConfig } from './types'

export function Accordion({ config }: { config: AccordionConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      setValue('__pressedSection', sectionId)
      if (config.onSectionChange) void dispatch(config.onSectionChange)
    },
    [config.onSectionChange, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <AccordionBase
        id={config.id}
        testID={config.testID}
        sections={config.sections}
        defaultOpenIds={config.defaultOpenIds}
        allowMultiple={config.allowMultiple ?? true}
        variant={(config.variant ?? 'default') as AccordionVariant}
        onSectionChange={handleSectionChange}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
