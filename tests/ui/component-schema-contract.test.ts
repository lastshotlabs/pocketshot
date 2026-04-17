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
import { DataListSchema } from '../../src/ui/components/data/data-list/schema'
import { DataTableSchema } from '../../src/ui/components/data/data-table/schema'
import { EmptyStateSchema } from '../../src/ui/components/data/empty-state/schema'
import { EntityPickerSchema } from '../../src/ui/components/data/entity-picker/schema'
import { FavoriteButtonSchema } from '../../src/ui/components/data/favorite-button/schema'
import { FilterBarSchema } from '../../src/ui/components/data/filter-bar/schema'
import { FilterSheetSchema } from '../../src/ui/components/data/filter-sheet/schema'
import { DetailCardSchema } from '../../src/ui/components/data/detail-card/schema'
import { HighlightedTextSchema } from '../../src/ui/components/data/highlighted-text/schema'
import { LoadingStateSchema } from '../../src/ui/components/data/loading-state/schema'
import { NotificationBellSchema } from '../../src/ui/components/data/notification-bell/schema'
import { PaginationSchema } from '../../src/ui/components/data/pagination/schema'
import { ProgressCircleSchema } from '../../src/ui/components/data/progress-circle/schema'
import { PullToRefreshSchema } from '../../src/ui/components/data/pull-to-refresh/schema'
import { SaveIndicatorSchema } from '../../src/ui/components/data/save-indicator/schema'
import { SkeletonSchema } from '../../src/ui/components/data/skeleton/schema'
import { SortPickerSchema } from '../../src/ui/components/data/sort-picker/schema'
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
        title: 'Summary',
        subtitle: { from: 'screen.subtitle' },
        bg: 'card',
        padding: 'xl',
        borderRadius: 'xl',
        shadow: 'lg',
        slots: {
          header: {
            paddingY: 'sm',
          },
          title: {
            letterSpacing: 'wide',
          },
          content: {
            gap: 'md',
          },
          item: {
            paddingY: 'sm',
          },
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
        slots: {
          legend: {
            paddingY: 'sm',
          },
          legendItem: {
            paddingX: 'xs',
          },
          series: {
            opacity: 0.9,
          },
          axis: {
            color: 'muted',
          },
        },
      }),
    ).toBeDefined()

    expect(
      DataListSchema.parse({
        itemType: 'user',
        data: { from: 'users.items' },
        slots: {
          list: {
            bg: 'card',
          },
          item: {
            paddingY: 'sm',
          },
          itemTitle: {
            letterSpacing: 'wide',
          },
          emptyState: {
            paddingY: 'lg',
          },
          loadingTitle: {
            opacity: 0.7,
          },
        },
      }),
    ).toBeDefined()

    expect(
      DataTableSchema.parse({
        data: { from: 'users.rows' },
        columns: [
          { key: 'name', label: 'Name', sortable: true },
          { key: 'email', label: 'Email' },
        ],
        sortKey: { from: 'users.sortKey' },
        sortDirection: { from: 'users.sortDir' },
        slots: {
          headerRow: {
            bg: 'card',
          },
          headerCell: {
            paddingY: 'sm',
          },
          row: {
            paddingY: 'sm',
          },
          cell: {
            color: 'muted',
          },
          emptyState: {
            paddingY: 'lg',
          },
        },
      }),
    ).toBeDefined()

    expect(
      FilterBarSchema.parse({
        id: 'content-filters',
        filters: [
          { id: 'all', label: 'All' },
          { id: 'favorites', label: 'Favorites', count: 4 },
        ],
        value: { from: 'filters.selected' },
        slots: {
          track: {
            paddingX: 'lg',
          },
          chip: {
            paddingY: 'sm',
            states: {
              selected: {
                bg: 'primary',
              },
            },
          },
          allChip: {
            borderRadius: 'full',
          },
          chipLabel: {
            letterSpacing: 'wide',
          },
          countBadge: {
            bg: 'muted',
          },
          countLabel: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      EntityPickerSchema.parse({
        id: 'content-assignee',
        data: { from: 'people.options' },
        value: { from: 'people.selected' },
        slots: {
          trigger: {
            paddingY: 'sm',
          },
          searchInput: {
            bg: 'card',
          },
          entityRow: {
            paddingY: 'sm',
          },
          entityLabel: {
            letterSpacing: 'wide',
          },
          emptyText: {
            color: 'muted',
          },
        },
      }),
    ).toBeDefined()

    expect(
      FilterSheetSchema.parse({
        id: 'content-filters-advanced',
        sections: [
          {
            id: 'type',
            label: 'Type',
            type: 'multi-select',
            options: [{ value: 'a', label: 'Alpha' }],
          },
        ],
        onApply: { type: 'set-value', target: 'filters.applied', value: true },
        onReset: { type: 'set-value', target: 'filters.reset', value: true },
        slots: {
          panel: {
            bg: 'card',
          },
          header: {
            paddingY: 'lg',
          },
          optionRow: {
            paddingY: 'sm',
            states: {
              selected: {
                bg: 'accent',
              },
            },
          },
          applyText: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      PaginationSchema.parse({
        id: 'content-pagination',
        mode: 'pages',
        totalPages: 8,
        currentPage: { from: 'table.page' },
        slots: {
          container: {
            paddingY: 'lg',
          },
          navButton: {
            paddingX: 'sm',
            states: {
              disabled: {
                opacity: 0.4,
              },
            },
          },
          pageIndicator: {
            paddingX: 'md',
          },
          pageText: {
            letterSpacing: 'wide',
          },
          currentPage: {
            color: 'primary',
          },
          loadMoreButton: {
            bg: 'card',
          },
          loadMoreText: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      PullToRefreshSchema.parse({
        id: 'content-refresh',
        refreshing: { from: 'feed.refreshing' },
        onRefresh: { type: 'set-value', target: 'feed.refresh', value: true },
        slots: {
          scrollView: {
            paddingY: 'lg',
          },
        },
      }),
    ).toBeDefined()

    expect(
      SortPickerSchema.parse({
        id: 'content-sort',
        value: { from: 'sort.selected' },
        options: [
          { value: 'recent', label: 'Most Recent', icon: 'clock' },
          { value: 'oldest', label: 'Oldest' },
        ],
        onSelect: { type: 'custom' },
        slots: {
          backdrop: {
            bg: 'rgba(0,0,0,0.6)',
          },
          panel: {
            bg: 'card',
          },
          header: {
            paddingY: 'lg',
          },
          option: {
            paddingY: 'sm',
            states: {
              selected: {
                bg: 'accent',
              },
            },
          },
          optionLabel: {
            letterSpacing: 'wide',
          },
          cancelLabel: {
            color: 'primary',
          },
        },
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
      HighlightedTextSchema.parse({
        text: { from: 'search.result' },
        highlight: { from: 'search.query' },
        slots: {
          mark: {
            letterSpacing: 'wide',
            color: 'warning',
          },
        },
      }),
    ).toBeDefined()

    expect(
      LoadingStateSchema.parse({
        height: '50%',
        borderRadius: 'lg',
        label: { from: 'loading.label' },
        slots: {
          label: {
            textAlign: 'center',
          },
          line: {
            opacity: 0.5,
          },
        },
      }),
    ).toBeDefined()

    expect(
      SkeletonSchema.parse({
        variant: 'custom',
        width: '60%',
        height: 32,
        borderRadius: 'full',
        animated: false,
        slots: {
          shape: {
            opacity: 0.6,
          },
          title: {
            width: '70%',
          },
          body: {
            opacity: 0.4,
          },
        },
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
      DetailCardSchema.parse({
        title: { from: 'profile.title' },
        subtitle: { from: 'profile.subtitle' },
        sections: [
          {
            fields: [
              {
                label: 'Email',
                value: { from: 'profile.email' },
                slots: {
                  fieldLabel: {
                    color: 'muted',
                  },
                },
              },
            ],
          },
        ],
        slots: {
          panel: {
            bg: 'card',
          },
          title: {
            letterSpacing: 'wide',
          },
          actionButton: {
            paddingX: 'sm',
          },
          fieldValue: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ProgressCircleSchema.parse({
        value: 64,
        color: 'success',
        label: { from: 'upload.label' },
        slots: {
          value: {
            letterSpacing: 'wide',
          },
          circularTrack: {
            opacity: 0.4,
          },
          circularFill: {
            opacity: 0.9,
          },
        },
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
        slots: {
          item: {
            paddingY: 'sm',
          },
          title: {
            letterSpacing: 'wide',
          },
        },
        items: [
          {
            id: 'activity-1',
            title: 'Created',
            slots: {
              marker: {
                opacity: 0.8,
              },
            },
          },
        ],
      }),
    ).toBeDefined()

    expect(
      ProgressBarSchema.parse({
        value: { from: 'upload.progress' },
        label: { from: 'upload.label' },
        height: 12,
        borderRadius: 'lg',
        slots: {
          label: {
            letterSpacing: 'wide',
          },
          value: {
            color: 'muted',
          },
          track: {
            opacity: 0.5,
          },
          fill: {
            opacity: 0.9,
          },
        },
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
