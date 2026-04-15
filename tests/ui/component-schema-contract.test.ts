import { describe, expect, it } from 'vitest'

import { ProductCardSchema } from '../../src/ui/components/commerce/product-card/schema'
import { PriceDisplaySchema } from '../../src/ui/components/commerce/price-display/schema'
import { ChatBubbleSchema } from '../../src/ui/components/communication/chat-bubble/schema'
import { BodySchema } from '../../src/ui/components/content/body/schema'
import { CodeBlockSchema } from '../../src/ui/components/content/code-block/schema'
import { HeadingSchema } from '../../src/ui/components/content/heading/schema'
import { ImageSchema } from '../../src/ui/components/content/image/schema'
import { ImageViewerSchema } from '../../src/ui/components/content/image-viewer/schema'
import { MarkdownSchema } from '../../src/ui/components/content/markdown/schema'
import { QrCodeSchema } from '../../src/ui/components/content/qr-code/schema'
import { RichTextEditorSchema } from '../../src/ui/components/content/rich-text-editor/schema'
import { RichTextViewerSchema } from '../../src/ui/components/content/rich-text-viewer/schema'
import { ChartSchema } from '../../src/ui/components/data/chart/schema'
import { LoadingStateSchema } from '../../src/ui/components/data/loading-state/schema'
import { ProgressCircleSchema } from '../../src/ui/components/data/progress-circle/schema'
import { PullToRefreshSchema } from '../../src/ui/components/data/pull-to-refresh/schema'
import { SkeletonSchema } from '../../src/ui/components/data/skeleton/schema'
import { TextInputSchema } from '../../src/ui/components/forms/text-input/schema'
import { DividerSchema } from '../../src/ui/components/layout/divider/schema'
import { RowSchema } from '../../src/ui/components/layout/row/schema'
import { CardSchema } from '../../src/ui/components/layout/card/schema'
import { AccordionSchema } from '../../src/ui/components/navigation/accordion/schema'
import { DrawerSchema } from '../../src/ui/components/overlay/drawer/schema'
import { ProgressBarSchema } from '../../src/ui/components/workflow/progress-bar/schema'
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
      PriceDisplaySchema.parse({
        amount: { from: 'product.price' },
        color: 'primary',
      }),
    ).toBeDefined()

    expect(
      HeadingSchema.parse({
        text: { from: 'screen.title' },
        textAlign: 'center',
        color: 'primary',
        letterSpacing: 'wide',
      }),
    ).toBeDefined()

    expect(
      BodySchema.parse({
        text: { from: 'screen.subtitle' },
        fontSize: 'base',
        fontWeight: 'medium',
        textAlign: 'justify',
        lineHeight: 'relaxed',
      }),
    ).toBeDefined()

    expect(
      ImageSchema.parse({
        src: { from: 'hero.image' },
        alt: 'Hero',
        width: '50%',
        borderRadius: 'xl',
      }),
    ).toBeDefined()

    expect(
      ImageViewerSchema.parse({
        source: { from: 'hero.image' },
        alt: 'Hero viewer',
        width: '75%',
        borderRadius: 'lg',
      }),
    ).toBeDefined()

    expect(
      MarkdownSchema.parse({
        content: { from: 'screen.markdown' },
        fontSize: 'lg',
        textAlign: 'center',
        color: 'muted',
      }),
    ).toBeDefined()

    expect(
      QrCodeSchema.parse({
        value: { from: 'screen.shareUrl' },
        color: 'primary',
        bg: 'card',
      }),
    ).toBeDefined()

    expect(
      RichTextViewerSchema.parse({
        content: { from: 'screen.richText' },
        color: 'muted',
        textAlign: 'center',
      }),
    ).toBeDefined()

    expect(
      CodeBlockSchema.parse({
        code: { from: 'screen.snippet' },
        bg: 'card',
        borderRadius: 'lg',
        color: 'muted',
      }),
    ).toBeDefined()

    expect(
      RichTextEditorSchema.parse({
        id: 'notes',
        placeholder: 'Start writing',
        minHeight: 160,
        maxHeight: 480,
        borderRadius: 'xl',
        bg: 'card',
      }),
    ).toBeDefined()

    expect(
      ChartSchema.parse({
        data: [{ label: 'Q1', value: 10 }],
        height: 240,
        shadow: 'sm',
      }),
    ).toBeDefined()

    expect(
      LoadingStateSchema.parse({
        height: '50%',
        borderRadius: 'lg',
      }),
    ).toBeDefined()

    expect(
      SkeletonSchema.parse({
        variant: 'custom',
        width: '60%',
        height: 32,
        borderRadius: 'full',
      }),
    ).toBeDefined()

    expect(
      PullToRefreshSchema.parse({
        onRefresh: { type: 'custom' },
        color: 'primary',
      }),
    ).toBeDefined()

    expect(
      ProgressCircleSchema.parse({
        value: 64,
        color: 'success',
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

    expect(
      ProgressBarSchema.parse({
        value: { from: 'upload.progress' },
        height: 12,
        borderRadius: 'lg',
      }),
    ).toBeDefined()

    expect(
      DividerSchema.parse({
        color: 'border',
        marginY: 'md',
      }),
    ).toBeDefined()
  })
})
