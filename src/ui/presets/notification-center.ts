import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface NotificationCenterPresetConfig {
  id: string
  /** Screen title. Defaults to "Notifications". */
  title?: string
  /** Notifications data endpoint (e.g. "GET /api/notifications"). */
  data: string
  /** Action dispatched when a notification item is pressed. */
  onItemPress?: Action
  /** Action dispatched when "Mark all read" is pressed. */
  onMarkAllRead?: Action
}

/** Creates a notification center screen: Header + FilterBar (All/Unread/Mentions) + NotificationFeed. */
export const notificationCenterPreset: PresetFactory<NotificationCenterPresetConfig> = (
  config,
) => {
  const title = config.title ?? 'Notifications'

  const components: ComponentConfig[] = []

  const header: ComponentConfig = {
    type: 'Header',
    id: `${config.id}-header`,
    title,
  }

  if (config.onMarkAllRead) {
    header.actions = [
      {
        type: 'Button',
        id: `${config.id}-mark-all-read`,
        label: 'Mark all read',
        variant: 'ghost',
        onPress: config.onMarkAllRead,
      } satisfies ComponentConfig,
    ]
  }

  components.push(header)

  components.push({
    type: 'FilterBar',
    id: `${config.id}-filters`,
    filters: [
      { id: 'all', label: 'All' },
      { id: 'unread', label: 'Unread' },
      { id: 'mentions', label: 'Mentions' },
    ],
  })

  const feed: ComponentConfig = {
    type: 'NotificationFeed',
    id: `${config.id}-feed`,
    data: config.data,
  }

  if (config.onItemPress) {
    feed.onItemPress = config.onItemPress
  }

  components.push(feed)

  const screen: ScreenConfig = {
    id: config.id,
    title,
    components,
  }

  return screen
}
