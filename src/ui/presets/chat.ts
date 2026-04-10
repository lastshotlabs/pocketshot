import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface ChatPresetConfig {
  id: string
  title: string
  /** Messages endpoint (e.g. "GET /api/rooms/123/messages"). */
  data: string
  /** Current user's ID for message alignment. */
  currentUserId: string
  /** Action dispatched when a message is sent. */
  onSend: Action
  /** Action dispatched when the attachment button is pressed. */
  onAttach?: Action
  /** Whether to show user avatars alongside messages. */
  showAvatars?: boolean
}

/** Creates a chat screen: Header + ChatWindow. */
export const chatPreset: PresetFactory<ChatPresetConfig> = (config) => {
  const components: ComponentConfig[] = [
    {
      type: 'Header',
      id: `${config.id}-header`,
      title: config.title,
      showBack: true,
    },
  ]

  const chatWindow: ComponentConfig = {
    type: 'ChatWindow',
    id: `${config.id}-chat`,
    data: config.data,
    currentUserId: config.currentUserId,
    onSend: config.onSend,
    showAvatars: config.showAvatars ?? true,
  }

  if (config.onAttach) {
    chatWindow.onAttach = config.onAttach
  }

  components.push(chatWindow)

  const screen: ScreenConfig = {
    id: config.id,
    title: config.title,
    components,
  }

  return screen
}
