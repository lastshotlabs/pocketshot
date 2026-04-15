import { describe, expect, it } from 'vitest'

import { ProductCardSchema } from '../../src/ui/components/commerce/product-card/schema'
import { ChatBubbleSchema } from '../../src/ui/components/communication/chat-bubble/schema'
import { TextInputSchema } from '../../src/ui/components/forms/text-input/schema'
import { RowSchema } from '../../src/ui/components/layout/row/schema'
import { CardSchema } from '../../src/ui/components/layout/card/schema'
import { AccordionSchema } from '../../src/ui/components/navigation/accordion/schema'
import { DrawerSchema } from '../../src/ui/components/overlay/drawer/schema'
import { TimelineSchema } from '../../src/ui/components/workflow/timeline/schema'

describe('component schemas inherit the shared base contract', () => {
  it('accepts universal base fields on representative component roots', () => {
    expect(
      RowSchema.parse({
        id: 'layout-root',
        gap: 'lg',
        visibleWhen: 'defined(user.id)',
        bg: 'background',
        padding: 'lg',
        alignItems: 'center',
        justifyContent: 'between',
        slots: {
          root: {
            paddingX: 'xl',
            states: {
              disabled: {
                opacity: 0.4,
              },
            },
          },
        },
      }),
    ).toMatchObject({
      id: 'layout-root',
      padding: 'lg',
    })

    expect(
      CardSchema.parse({
        id: 'summary-card',
        bg: 'card',
        padding: 'xl',
        borderRadius: 'xl',
        shadow: 'lg',
        slots: {
          root: {
            states: {
              open: {
                shadow: 'xl',
              },
            },
          },
        },
      }),
    ).toMatchObject({
      id: 'summary-card',
      borderRadius: 'xl',
    })

    expect(
      DrawerSchema.parse({
        id: 'app-drawer',
        title: 'Menu',
        visible: { expr: 'defined(route.name)' },
        shadow: 'lg',
        slots: {
          root: {
            states: {
              open: {
                bg: 'card',
              },
            },
          },
        },
      }),
    ).toMatchObject({
      id: 'app-drawer',
      title: 'Menu',
    })
  })

  it('accepts shared ref and base styling semantics across categories', () => {
    expect(
      ProductCardSchema.parse({
        title: { from: 'product.name' },
        price: { from: 'product.price' },
        visible: { from: 'product.visible' },
        borderRadius: 'lg',
      }),
    ).toBeDefined()

    expect(
      ChatBubbleSchema.parse({
        message: { from: 'thread.latest.message' },
        timestamp: { from: 'thread.latest.timestamp' },
        isOwn: { from: 'thread.latest.isOwn' },
        marginY: 'sm',
      }),
    ).toBeDefined()

    expect(
      TextInputSchema.parse({
        id: 'email',
        value: { from: 'form.email' },
        errorText: { from: 'form.errors.email' },
        visibleWhen: 'empty(form.hidden.email)',
        slots: {
          root: {
            states: {
              invalid: {
                border: '1px solid destructive',
              },
            },
          },
        },
      }),
    ).toBeDefined()

    expect(
      AccordionSchema.parse({
        sections: [
          {
            id: 'overview',
            title: 'Overview',
          },
        ],
        gap: 'md',
        slots: {
          root: {
            states: {
              open: {
                shadow: 'md',
              },
            },
          },
        },
      }),
    ).toBeDefined()

    expect(
      TimelineSchema.parse({
        data: { from: 'activity.items' },
        animation: {
          enter: 'fade-up',
        },
      }),
    ).toBeDefined()
  })
})
