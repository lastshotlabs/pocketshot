import { describe, expect, it } from 'vitest'

import { ProductCardSchema } from '../../src/ui/components/commerce/product-card/schema'
import { PriceDisplaySchema } from '../../src/ui/components/commerce/price-display/schema'
import { CartItemSchema } from '../../src/ui/components/commerce/cart-item/schema'
import { PricingTableSchema } from '../../src/ui/components/commerce/pricing-table/schema'
import { ChatBubbleSchema } from '../../src/ui/components/communication/chat-bubble/schema'
import { PresenceIndicatorSchema } from '../../src/ui/components/communication/presence-indicator/schema'
import { TypingIndicatorSchema } from '../../src/ui/components/communication/typing-indicator/schema'
import { BodySchema } from '../../src/ui/components/content/body/schema'
import { AudioPlayerSchema } from '../../src/ui/components/content/audio-player/schema'
import { CodeBlockSchema } from '../../src/ui/components/content/code-block/schema'
import { CompareViewSchema } from '../../src/ui/components/content/compare-view/schema'
import { FileUploaderSchema } from '../../src/ui/components/content/file-uploader/schema'
import { HeadingSchema } from '../../src/ui/components/content/heading/schema'
import { ImageSchema } from '../../src/ui/components/content/image/schema'
import { ImageViewerSchema } from '../../src/ui/components/content/image-viewer/schema'
import { LabelSchema } from '../../src/ui/components/content/label/schema'
import { LinkSchema } from '../../src/ui/components/content/link/schema'
import { LinkEmbedSchema } from '../../src/ui/components/content/link-embed/schema'
import { MarkdownSchema } from '../../src/ui/components/content/markdown/schema'
import { MediaPickerSchema } from '../../src/ui/components/content/media-picker/schema'
import { QrCodeSchema } from '../../src/ui/components/content/qr-code/schema'
import { QrScannerSchema } from '../../src/ui/components/content/qr-scanner/schema'
import { RichInputSchema } from '../../src/ui/components/content/rich-input/schema'
import { RichTextEditorSchema } from '../../src/ui/components/content/rich-text-editor/schema'
import { RichTextViewerSchema } from '../../src/ui/components/content/rich-text-viewer/schema'
import { VideoPlayerSchema } from '../../src/ui/components/content/video-player/schema'
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
import { PasswordInputSchema } from '../../src/ui/components/forms/password-input/schema'
import { PhoneInputSchema } from '../../src/ui/components/forms/phone-input/schema'
import { PinInputSchema } from '../../src/ui/components/forms/pin-input/schema'
import { SelectSchema } from '../../src/ui/components/forms/select/schema'
import { RadioGroupSchema } from '../../src/ui/components/forms/radio-group/schema'
import { CheckboxGroupSchema } from '../../src/ui/components/forms/checkbox-group/schema'
import { FormFieldSchema } from '../../src/ui/components/forms/form-field/schema'
import { InlineEditSchema } from '../../src/ui/components/forms/inline-edit/schema'
import { MultiSelectSchema } from '../../src/ui/components/forms/multi-select/schema'
import { SliderSchema } from '../../src/ui/components/forms/slider/schema'
import { RatingInputSchema } from '../../src/ui/components/forms/rating-input/schema'
import { TagSelectorSchema } from '../../src/ui/components/forms/tag-selector/schema'
import { TextareaSchema } from '../../src/ui/components/forms/textarea/schema'
import { ButtonSchema } from '../../src/ui/components/forms/button/schema'
import { CheckboxSchema } from '../../src/ui/components/forms/checkbox/schema'
import { SearchBarSchema } from '../../src/ui/components/forms/search-bar/schema'
import { SwitchSchema } from '../../src/ui/components/forms/switch/schema'
import { ToggleSchema } from '../../src/ui/components/forms/toggle/schema'
import { DividerSchema } from '../../src/ui/components/layout/divider/schema'
import { SpacerSchema } from '../../src/ui/components/layout/spacer/schema'
import { ScreenSchema } from '../../src/ui/components/layout/screen/schema'
import { KeyboardAvoidingScreenSchema } from '../../src/ui/components/layout/keyboard-avoiding-screen/schema'
import { RowSchema } from '../../src/ui/components/layout/row/schema'
import { CardSchema } from '../../src/ui/components/layout/card/schema'
import { ScrollContainerSchema } from '../../src/ui/components/layout/scroll-container/schema'
import { StackSchema } from '../../src/ui/components/layout/stack/schema'
import { SectionSchema } from '../../src/ui/components/layout/section/schema'
import { AccordionSchema } from '../../src/ui/components/navigation/accordion/schema'
import { BackButtonSchema } from '../../src/ui/components/navigation/back-button/schema'
import { BottomTabBarSchema } from '../../src/ui/components/navigation/bottom-tab-bar/schema'
import { DrawerMenuSchema } from '../../src/ui/components/navigation/drawer-menu/schema'
import { DrawerSchema } from '../../src/ui/components/overlay/drawer/schema'
import { ModalSchema } from '../../src/ui/components/overlay/modal/schema'
import { PopoverSchema } from '../../src/ui/components/overlay/popover/schema'
import { BottomSheetSchema } from '../../src/ui/components/overlay/bottom-sheet/schema'
import { ConfirmDialogSchema } from '../../src/ui/components/overlay/confirm-dialog/schema'
import { DropdownMenuSchema } from '../../src/ui/components/overlay/dropdown-menu/schema'
import { ContextMenuSchema } from '../../src/ui/components/overlay/context-menu/schema'
import { ActionSheetSchema } from '../../src/ui/components/overlay/action-sheet/schema'
import { CommandPaletteSchema } from '../../src/ui/components/overlay/command-palette/schema'
import { ToastSchema } from '../../src/ui/components/overlay/toast/schema'
import { TopBarSchema } from '../../src/ui/components/navigation/top-bar/schema'
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
          panel: {
            bg: 'card',
          },
          title: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toMatchObject({
      id: 'app-drawer',
      title: 'Menu',
    })

    expect(
      ModalSchema.parse({
        id: 'settings-modal',
        title: 'Settings',
        size: 'lg',
        slots: {
          contentWrapper: {
            bg: 'card',
          },
          title: {
            letterSpacing: 'wide',
          },
          body: {
            paddingY: 'lg',
          },
        },
      }),
    ).toMatchObject({
      id: 'settings-modal',
      size: 'lg',
    })

    expect(
      PopoverSchema.parse({
        id: 'profile-help',
        triggerLabel: 'Help',
        content: 'Popover content',
        position: 'top',
        slots: {
          trigger: {
            paddingY: 'sm',
          },
          panel: {
            bg: 'card',
          },
          content: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toMatchObject({
      id: 'profile-help',
      position: 'top',
    })

    expect(
      ConfirmDialogSchema.parse({
        id: 'delete-confirm',
        title: 'Delete?',
        message: 'This cannot be undone.',
        variant: 'destructive',
        onConfirm: { type: 'set-value', target: 'confirm.ok', value: true },
        slots: {
          panel: {
            bg: 'card',
          },
          title: {
            letterSpacing: 'wide',
          },
          confirmText: {
            fontWeight: 'bold',
          },
        },
      }),
    ).toMatchObject({
      id: 'delete-confirm',
      variant: 'destructive',
    })

    expect(
      DropdownMenuSchema.parse({
        id: 'actions-menu',
        trigger: {
          label: 'Actions',
          icon: 'more',
        },
        align: 'end',
        items: [
          {
            id: 'edit',
            label: 'Edit',
            onPress: { type: 'set-value', target: 'menu.edit', value: true },
          },
          {
            id: 'delete',
            label: 'Delete',
            destructive: true,
            onPress: { type: 'set-value', target: 'menu.delete', value: true },
          },
        ],
        slots: {
          trigger: {
            paddingY: 'sm',
          },
          panel: {
            bg: 'card',
          },
          itemLabel: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toMatchObject({
      id: 'actions-menu',
      align: 'end',
    })

    expect(
      ContextMenuSchema.parse({
        id: 'file-menu',
        triggerLabel: 'File actions',
        items: [
          {
            id: 'open',
            label: 'Open',
            onPress: { type: 'set-value', target: 'menu.open', value: true },
          },
          {
            id: 'delete',
            label: 'Delete',
            destructive: true,
            onPress: { type: 'set-value', target: 'menu.delete', value: true },
          },
        ],
        slots: {
          panel: {
            bg: 'card',
          },
          itemLabel: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toMatchObject({
      id: 'file-menu',
      triggerLabel: 'File actions',
    })

    expect(
      ActionSheetSchema.parse({
        id: 'actions-sheet',
        slots: {
          container: {
            bg: 'card',
          },
          title: {
            letterSpacing: 'wide',
          },
          optionText: {
            color: 'primary',
          },
        },
      }),
    ).toMatchObject({
      id: 'actions-sheet',
    })

    expect(
      BackButtonSchema.parse({
        id: 'back-link',
        label: 'Back',
        slots: {
          button: {
            paddingY: 'sm',
          },
          label: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toMatchObject({
      id: 'back-link',
      label: 'Back',
    })

    expect(
      BottomTabBarSchema.parse({
        id: 'main-tabs',
        tabs: [
          { id: 'home', label: 'Home', icon: 'Home' },
          { id: 'profile', label: 'Profile', icon: 'Profile' },
        ],
        slots: {
          tab: {
            paddingY: 'sm',
          },
          label: {
            letterSpacing: 'wide',
          },
          indicator: {
            borderRadius: 'full',
          },
        },
      }),
    ).toMatchObject({
      id: 'main-tabs',
      position: 'bottom',
    })

    expect(
      TopBarSchema.parse({
        id: 'top-shell',
        title: 'Shell',
        subtitle: 'Overview',
        leftAction: 'back',
        slots: {
          row: {
            paddingY: 'sm',
          },
          title: {
            letterSpacing: 'wide',
          },
          iconText: {
            color: 'primary',
          },
        },
      }),
    ).toMatchObject({
      id: 'top-shell',
      title: 'Shell',
    })

    expect(
      DrawerMenuSchema.parse({
        id: 'nav-drawer-menu',
        items: [
          { id: 'home', label: 'Home', section: 'Main' },
          { id: 'settings', label: 'Settings', section: 'Main' },
        ],
        slots: {
          panel: {
            bg: 'card',
          },
          menuItemLabel: {
            letterSpacing: 'wide',
          },
          footerLabel: {
            color: 'muted',
          },
        },
      }),
    ).toMatchObject({
      id: 'nav-drawer-menu',
    })

    expect(
      BottomSheetSchema.parse({
        id: 'details-sheet',
        title: 'Details',
        snapPoints: ['40%', '75%'],
        slots: {
          panel: {
            bg: 'card',
          },
          title: {
            letterSpacing: 'wide',
          },
          content: {
            paddingY: 'lg',
          },
        },
      }),
    ).toMatchObject({
      id: 'details-sheet',
      title: 'Details',
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
        slots: {
          text: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      BodySchema.parse({
        text: { from: 'screen.subtitle' },
        fontSize: 'base',
        fontWeight: 'medium',
        textAlign: 'justify',
        lineHeight: 'relaxed',
        slots: {
          text: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      LabelSchema.parse({
        text: { from: 'screen.badge' },
        color: 'primary',
        slots: {
          text: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      LinkSchema.parse({
        text: { from: 'screen.cta' },
        action: { type: 'open-url', url: 'https://example.com' },
        slots: {
          button: {
            paddingY: 'sm',
          },
          text: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      LinkEmbedSchema.parse({
        url: { from: 'screen.embed.url' },
        title: { from: 'screen.embed.title' },
        description: { from: 'screen.embed.description' },
        slots: {
          card: {
            borderRadius: 'xl',
          },
          title: {
            letterSpacing: 'wide',
          },
          playButton: {
            borderRadius: 'full',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ImageSchema.parse({
        src: { from: 'hero.image' },
        alt: 'Hero',
        width: '50%',
        borderRadius: 'xl',
        slots: {
          pressable: {
            borderRadius: 'lg',
          },
          image: {
            borderRadius: 'xl',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ImageViewerSchema.parse({
        source: { from: 'hero.image' },
        alt: 'Hero viewer',
        width: '75%',
        borderRadius: 'lg',
        slots: {
          thumbnailContainer: {
            borderRadius: 'xl',
          },
          captionText: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      MarkdownSchema.parse({
        content: { from: 'screen.markdown' },
        fontSize: 'lg',
        textAlign: 'center',
        color: 'muted',
        slots: {
          container: {
            paddingY: 'sm',
          },
          heading: {
            letterSpacing: 'wide',
          },
          paragraph: {
            color: 'muted',
          },
        },
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
      AudioPlayerSchema.parse({
        source: { from: 'media.audio' },
        title: { from: 'media.title' },
        color: 'muted',
        slots: {
          container: {
            borderRadius: 'xl',
          },
          playButton: {
            states: {
              disabled: {
                opacity: 0.4,
              },
            },
          },
          timeText: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      VideoPlayerSchema.parse({
        source: { from: 'media.video' },
        poster: { from: 'media.poster' },
        borderRadius: 'xl',
        slots: {
          container: {
            borderRadius: 'xl',
          },
          centerPlayButton: {
            borderRadius: 'full',
          },
          fallbackCommand: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      CompareViewSchema.parse({
        left: { label: 'Before', content: { from: 'diff.before' } },
        right: { label: 'After', content: { from: 'diff.after' } },
        bg: 'card',
        borderRadius: 'xl',
        slots: {
          header: {
            paddingY: 'sm',
          },
          panelLabel: {
            letterSpacing: 'wide',
          },
          panelCodeLine: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      FileUploaderSchema.parse({
        id: 'asset-upload',
        label: { from: 'copy.uploadLabel' },
        value: { from: 'assets.selected' },
        slots: {
          dropZone: {
            borderRadius: 'xl',
          },
          fileName: {
            letterSpacing: 'wide',
          },
          removeText: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      QrScannerSchema.parse({
        id: 'scanner',
        onScan: { type: 'set-value', target: 'scan.value', value: true },
        overlayText: { from: 'copy.scanPrompt' },
        slots: {
          fallback: {
            borderRadius: 'xl',
          },
          overlayText: {
            letterSpacing: 'wide',
          },
          submitButton: {
            borderRadius: 'full',
          },
        },
      }),
    ).toBeDefined()

    expect(
      MediaPickerSchema.parse({
        id: 'story-media',
        mediaTypes: ['image', 'video'],
        onSelect: { type: 'set-value', target: 'media.selected', value: true },
        slots: {
          pickButton: {
            borderRadius: 'xl',
          },
          pickLabel: {
            letterSpacing: 'wide',
          },
          removeButton: {
            borderRadius: 'full',
          },
        },
      }),
    ).toBeDefined()

    expect(
      RichInputSchema.parse({
        id: 'notes-input',
        value: { from: 'draft.notes' },
        label: { from: 'copy.notesLabel' },
        placeholder: { from: 'copy.notesPlaceholder' },
        slots: {
          toolbar: {
            borderRadius: 'xl',
          },
          toolbarLabel: {
            color: 'primary',
          },
          input: {
            borderRadius: 'lg',
          },
        },
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
        slots: {
          toolbar: {
            borderRadius: 'xl',
          },
          input: {
            borderRadius: 'lg',
          },
          footerText: {
            color: 'primary',
          },
        },
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
      ButtonSchema.parse({
        id: 'save-button',
        label: { from: 'form.submitLabel' },
        onPress: { type: 'set-value', target: 'form.submit', value: true },
        slots: {
          button: {
            paddingY: 'sm',
          },
          label: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      CheckboxSchema.parse({
        id: 'terms-checkbox',
        label: 'Accept terms',
        slots: {
          row: {
            paddingY: 'sm',
          },
          box: {
            borderRadius: 'md',
          },
          label: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()

    expect(
      SwitchSchema.parse({
        id: 'notifications-switch',
        label: 'Enable notifications',
        slots: {
          row: {
            paddingY: 'sm',
          },
          label: {
            letterSpacing: 'wide',
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
          input: {
            borderRadius: 'lg',
          },
          label: {
            letterSpacing: 'wide',
          },
          errorText: {
            color: 'error',
          },
        },
      }),
    ).toBeDefined()

    expect(
      TextareaSchema.parse({
        id: 'bio',
        showCharCount: true,
        maxLength: 140,
        slots: {
          inputWrapper: {
            borderRadius: 'lg',
          },
          label: {
            letterSpacing: 'wide',
          },
          charCount: {
            color: 'muted',
          },
        },
      }),
    ).toBeDefined()

    expect(
      SearchBarSchema.parse({
        id: 'search',
        showCancelButton: true,
        slots: {
          inputContainer: {
            borderRadius: 'lg',
          },
          input: {
            letterSpacing: 'wide',
          },
          cancelText: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      PasswordInputSchema.parse({
        id: 'account-password',
        slots: {
          inputRow: {
            borderRadius: 'lg',
          },
          toggleText: {
            color: 'primary',
          },
          errorText: {
            color: 'error',
          },
        },
      }),
    ).toBeDefined()

    expect(
      PhoneInputSchema.parse({
        id: 'phone',
        slots: {
          inputRow: {
            borderRadius: 'lg',
          },
          searchInput: {
            borderRadius: 'lg',
          },
          countryRowName: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      PinInputSchema.parse({
        id: 'verification-pin',
        length: 4,
        slots: {
          boxRow: {
            gap: 'lg',
          },
          box: {
            borderRadius: 'lg',
          },
        },
      }),
    ).toBeDefined()

    expect(
      SelectSchema.parse({
        id: 'status',
        options: [{ label: 'Draft', value: 'draft' }],
        slots: {
          trigger: {
            borderRadius: 'lg',
          },
          sheet: {
            borderRadius: 'xl',
          },
          optionText: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      RadioGroupSchema.parse({
        id: 'theme',
        options: [{ value: 'light', label: 'Light' }],
        slots: {
          optionsList: {
            gap: 'lg',
          },
          control: {
            borderRadius: 'full',
          },
          optionLabel: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      CheckboxGroupSchema.parse({
        id: 'interests',
        options: [{ value: 'photo', label: 'Photography' }],
        slots: {
          optionsList: {
            gap: 'lg',
          },
          box: {
            borderRadius: 'lg',
          },
          optionLabel: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      FormFieldSchema.parse({
        label: { from: 'copy.fieldLabel' },
        helperText: { from: 'copy.fieldHelper' },
        slots: {
          label: {
            letterSpacing: 'wide',
          },
          helperText: {
            color: 'muted',
          },
          errorText: {
            color: 'error',
          },
        },
      }),
    ).toBeDefined()

    expect(
      InlineEditSchema.parse({
        id: 'budget-inline',
        value: { from: 'budget.value' },
        prefix: { from: 'budget.currency' },
        suffix: { from: 'budget.period' },
        emptyText: { from: 'budget.empty' },
        slots: {
          displayText: {
            letterSpacing: 'wide',
          },
          editRow: {
            borderRadius: 'lg',
          },
          confirmText: {
            color: 'success',
          },
        },
      }),
    ).toBeDefined()

    expect(
      MultiSelectSchema.parse({
        id: 'audiences',
        options: [{ value: 'creator', label: 'Creator' }],
        label: { from: 'copy.audienceLabel' },
        placeholder: { from: 'copy.audiencePlaceholder' },
        emptyMessage: { from: 'copy.audienceEmpty' },
        slots: {
          trigger: {
            borderRadius: 'lg',
          },
          optionLabel: {
            color: 'primary',
          },
          doneButton: {
            borderRadius: 'md',
          },
        },
      }),
    ).toBeDefined()

    expect(
      SliderSchema.parse({
        id: 'volume',
        slots: {
          header: {
            paddingY: 'sm',
          },
          track: {
            borderRadius: 'full',
          },
          thumb: {
            borderRadius: 'full',
          },
        },
      }),
    ).toBeDefined()

    expect(
      RatingInputSchema.parse({
        id: 'rating',
        slots: {
          starsRow: {
            gap: 'lg',
          },
          star: {
            color: 'warning',
          },
        },
      }),
    ).toBeDefined()

    expect(
      TagSelectorSchema.parse({
        id: 'tags',
        availableTags: [{ id: 'photo', label: 'Photography' }],
        slots: {
          tagsRow: {
            gap: 'lg',
          },
          tag: {
            borderRadius: 'full',
          },
          tagText: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ToggleSchema.parse({
        id: 'feature-toggle',
        label: { from: 'toggle.label' },
        value: { from: 'toggle.value' },
        disabled: { from: 'toggle.disabled' },
        slots: {
          button: {
            paddingY: 'sm',
          },
          label: {
            letterSpacing: 'wide',
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
          title: {
            letterSpacing: 'wide',
          },
          body: {
            paddingY: 'sm',
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
      CommandPaletteSchema.parse({
        id: 'global-commands',
        placeholder: 'Find actions',
        items: [
          {
            id: 'open-settings',
            label: 'Open Settings',
            description: 'Navigate to settings',
            group: 'Navigation',
            shortcut: 'G S',
            onSelect: { type: 'custom' },
          },
        ],
        slots: {
          panel: {
            bg: 'card',
          },
          searchInput: {
            color: 'foreground',
          },
          itemLabel: {
            letterSpacing: 'wide',
          },
          emptyText: {
            color: 'muted',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ToastSchema.parse({
        id: 'app-toast',
        position: 'top',
        slots: {
          container: {
            paddingY: 'sm',
          },
          toast: {
            borderRadius: 'xl',
          },
          message: {
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
        slots: {
          line: {
            bg: 'border',
          },
        },
      }),
    ).toBeDefined()

    expect(
      SpacerSchema.parse({
        size: 8,
        slots: {
          root: {
            bg: 'muted',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ScreenSchema.parse({
        scrollable: true,
        padding: 'lg',
        slots: {
          viewport: {
            bg: 'card',
          },
          content: {
            paddingY: 'xl',
          },
        },
      }),
    ).toBeDefined()

    expect(
      KeyboardAvoidingScreenSchema.parse({
        behavior: 'padding',
        slots: {
          keyboardAvoiding: {
            bg: 'card',
          },
          content: {
            paddingY: 'xl',
          },
        },
      }),
    ).toBeDefined()

    expect(
      PriceDisplaySchema.parse({
        amount: 19.99,
        badge: 'SALE',
        slots: {
          price: {
            color: 'primary',
          },
          badge: {
            borderRadius: 'md',
          },
        },
      }),
    ).toBeDefined()

    expect(
      ProductCardSchema.parse({
        title: 'Keyboard',
        price: 99.99,
        slots: {
          card: {
            borderRadius: 'xl',
          },
          title: {
            letterSpacing: 'wide',
          },
          addButton: {
            borderRadius: 'lg',
          },
        },
      }),
    ).toBeDefined()

    expect(
      CartItemSchema.parse({
        title: 'Widget',
        price: 10,
        slots: {
          row: {
            borderRadius: 'lg',
          },
          quantityButton: {
            borderRadius: 'md',
          },
          total: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      PricingTableSchema.parse({
        tiers: [
          {
            id: 'pro',
            name: 'Pro',
            price: '$12',
            features: ['Unlimited projects'],
            cta: {
              label: 'Choose Pro',
              onPress: { type: 'navigate', to: '/checkout' },
            },
          },
        ],
        slots: {
          card: {
            borderRadius: 'xl',
          },
          title: {
            letterSpacing: 'wide',
          },
          ctaButton: {
            borderRadius: 'lg',
          },
        },
      }),
    ).toBeDefined()

    expect(
      CodeBlockSchema.parse({
        code: 'const x = 1',
        slots: {
          container: {
            borderRadius: 'xl',
          },
          header: {
            paddingY: 'sm',
          },
          codeLine: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()

    expect(
      QrCodeSchema.parse({
        value: 'https://example.com',
        slots: {
          container: {
            borderRadius: 'xl',
          },
          caption: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()
  })
})
