import { describe, expect, it } from 'vitest'

import { ProductCardSchema } from '../../src/ui/components/commerce/product-card/schema'
import { PriceDisplaySchema } from '../../src/ui/components/commerce/price-display/schema'
import { ChatBubbleSchema } from '../../src/ui/components/communication/chat-bubble/schema'
import { PresenceIndicatorSchema } from '../../src/ui/components/communication/presence-indicator/schema'
import { TypingIndicatorSchema } from '../../src/ui/components/communication/typing-indicator/schema'
import { BodySchema } from '../../src/ui/components/content/body/schema'
import { CodeBlockSchema } from '../../src/ui/components/content/code-block/schema'
import { HeadingSchema } from '../../src/ui/components/content/heading/schema'
import { ImageSchema } from '../../src/ui/components/content/image/schema'
import { ImageViewerSchema } from '../../src/ui/components/content/image-viewer/schema'
import { MarkdownSchema } from '../../src/ui/components/content/markdown/schema'
import { QrCodeSchema } from '../../src/ui/components/content/qr-code/schema'
import { RichTextEditorSchema } from '../../src/ui/components/content/rich-text-editor/schema'
import { RichTextViewerSchema } from '../../src/ui/components/content/rich-text-viewer/schema'
import { AlertSchema } from '../../src/ui/components/data/alert/schema'
import { AvatarSchema } from '../../src/ui/components/data/avatar/schema'
import { AvatarGroupSchema } from '../../src/ui/components/data/avatar-group/schema'
import { BadgeSchema } from '../../src/ui/components/data/badge/schema'
import { ChartSchema } from '../../src/ui/components/data/chart/schema'
import { EmptyStateSchema } from '../../src/ui/components/data/empty-state/schema'
import { FavoriteButtonSchema } from '../../src/ui/components/data/favorite-button/schema'
import { LoadingStateSchema } from '../../src/ui/components/data/loading-state/schema'
import { NotificationBellSchema } from '../../src/ui/components/data/notification-bell/schema'
import { ProgressCircleSchema } from '../../src/ui/components/data/progress-circle/schema'
import { PullToRefreshSchema } from '../../src/ui/components/data/pull-to-refresh/schema'
import { SaveIndicatorSchema } from '../../src/ui/components/data/save-indicator/schema'
import { SkeletonSchema } from '../../src/ui/components/data/skeleton/schema'
import { StatCardSchema } from '../../src/ui/components/data/stat-card/schema'
import { TooltipSchema } from '../../src/ui/components/data/tooltip/schema'
import { TextInputSchema } from '../../src/ui/components/forms/text-input/schema'
import { DividerSchema } from '../../src/ui/components/layout/divider/schema'
import { RowSchema } from '../../src/ui/components/layout/row/schema'
import { CardSchema } from '../../src/ui/components/layout/card/schema'
import { ScrollContainerSchema } from '../../src/ui/components/layout/scroll-container/schema'
import { StackSchema } from '../../src/ui/components/layout/stack/schema'
import { SectionSchema } from '../../src/ui/components/layout/section/schema'
import { AccordionSchema } from '../../src/ui/components/navigation/accordion/schema'
import { DrawerSchema } from '../../src/ui/components/overlay/drawer/schema'
import { ProgressBarSchema } from '../../src/ui/components/workflow/progress-bar/schema'
import { TimelineSchema } from '../../src/ui/components/workflow/timeline/schema'
import { StatusBadgeSchema } from '../../src/ui/components/workflow/status-badge/schema'

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
          item: {
            paddingY: 'sm',
          },
        },
      }),
    ).toMatchObject({
      id: 'layout-root',
      padding: 'lg',
    })

    expect(
      StackSchema.parse({
        id: 'summary-stack',
        gap: 'lg',
        bg: 'card',
        slots: {
          root: {
            padding: 'lg',
          },
          item: {
            paddingX: 'sm',
          },
        },
      }),
    ).toMatchObject({
      id: 'summary-stack',
      gap: 'lg',
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
      SectionSchema.parse({
        id: 'profile-section',
        title: 'Profile',
        slots: {
          root: {
            padding: 'lg',
          },
          item: {
            paddingY: 'sm',
          },
        },
      }),
    ).toMatchObject({
      id: 'profile-section',
      title: 'Profile',
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
      BadgeSchema.parse({
        label: { from: 'item.status' },
        color: 'primary',
        slots: {
          label: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      AlertSchema.parse({
        title: 'Warning',
        body: 'Check the current state.',
        color: 'warning',
        slots: {
          title: {
            fontWeight: 'bold',
          },
        },
      }),
    ).toBeDefined()

    expect(
      AvatarSchema.parse({
        name: { from: 'user.name' },
        color: 'primary',
        slots: {
          initials: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      AvatarGroupSchema.parse({
        avatars: { from: 'team.members' },
        slots: {
          overflow: {
            bg: 'muted',
          },
        },
      }),
    ).toBeDefined()

    expect(
      FavoriteButtonSchema.parse({
        value: { from: 'item.favorite' },
        color: 'warning',
        slots: {
          icon: {
            opacity: 0.8,
          },
        },
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
      EmptyStateSchema.parse({
        title: 'Nothing here',
        color: 'muted',
        slots: {
          title: {
            textAlign: 'center',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ProgressCircleSchema.parse({
        value: 64,
        color: 'success',
      }),
    ).toBeDefined()

    expect(
      SaveIndicatorSchema.parse({
        status: { from: 'draft.saveState' },
        color: 'muted',
        slots: {
          label: {
            fontSize: 'sm',
          },
        },
      }),
    ).toBeDefined()

    expect(
      TooltipSchema.parse({
        trigger: { from: 'tooltip.trigger' },
        content: { from: 'tooltip.content' },
        slots: {
          content: {
            bg: 'muted',
          },
        },
      }),
    ).toBeDefined()

    expect(
      StatCardSchema.parse({
        label: 'Revenue',
        value: { from: 'stats.revenue' },
        color: 'muted',
        slots: {
          value: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      NotificationBellSchema.parse({
        count: { from: 'notifications.unread' },
        color: 'primary',
        slots: {
          button: {
            paddingX: 'sm',
          },
        },
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
      PresenceIndicatorSchema.parse({
        status: { from: 'user.presence' },
        color: 'primary',
        slots: {
          label: {
            textAlign: 'center',
          },
        },
      }),
    ).toBeDefined()

    expect(
      TypingIndicatorSchema.parse({
        isTyping: { from: 'chat.typing' },
        userName: { from: 'chat.user' },
        color: 'muted',
        slots: {
          text: {
            textAlign: 'center',
          },
        },
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
        color: 'muted',
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
      StatusBadgeSchema.parse({
        status: { from: 'order.status' },
        color: 'primary',
        slots: {
          label: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ScrollContainerSchema.parse({
        contentPadding: 'md',
        slots: {
          root: {
            bg: 'card',
          },
          viewport: {
            paddingY: 'lg',
          },
        },
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
