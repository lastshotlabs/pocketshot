import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'
import { ChatWindow } from '../components/communication/chat-window/component'
import { ChatWindowSchema } from '../components/communication/chat-window/schema'
import { CommentSection } from '../components/communication/comment-section/component'
import { CommentSectionSchema } from '../components/communication/comment-section/schema'
import { EmojiPicker } from '../components/communication/emoji-picker/component'
import { EmojiPickerSchema } from '../components/communication/emoji-picker/schema'
import { Feed } from '../components/communication/feed/component'
import { FeedSchema } from '../components/communication/feed/schema'
import { GifPicker } from '../components/communication/gif-picker/component'
import { GifPickerSchema } from '../components/communication/gif-picker/schema'
import { MessageThread } from '../components/communication/message-thread/component'
import { MessageThreadSchema } from '../components/communication/message-thread/schema'
import { ReactionBar } from '../components/communication/reaction-bar/component'
import { ReactionBarSchema } from '../components/communication/reaction-bar/schema'
import { ReactionPicker } from '../components/communication/reaction-picker/component'
import { ReactionPickerSchema } from '../components/communication/reaction-picker/schema'
import { DatePicker } from '../components/forms/date-picker/component'
import { DatePickerSchema } from '../components/forms/date-picker/schema'
import { DateRangePicker } from '../components/forms/date-range-picker/component'
import { DateRangePickerSchema } from '../components/forms/date-range-picker/schema'
import { LocationInput } from '../components/forms/location-input/component'
import { LocationInputSchema } from '../components/forms/location-input/schema'
import { QuickAdd } from '../components/forms/quick-add/component'
import { QuickAddSchema } from '../components/forms/quick-add/schema'
import { TimePicker } from '../components/forms/time-picker/component'
import { TimePickerSchema } from '../components/forms/time-picker/schema'
import { Wizard } from '../components/forms/wizard/component'
import { WizardSchema } from '../components/forms/wizard/schema'
import { TreeView } from '../components/navigation/tree-view/component'
import { TreeViewSchema } from '../components/navigation/tree-view/schema'
import { AuditLog } from '../components/workflow/audit-log/component'
import { AuditLogSchema } from '../components/workflow/audit-log/schema'
import { Calendar } from '../components/workflow/calendar/component'
import { CalendarSchema } from '../components/workflow/calendar/schema'
import { KanbanBoard } from '../components/workflow/kanban-board/component'
import { KanbanBoardSchema } from '../components/workflow/kanban-board/schema'
import { NotificationFeed } from '../components/workflow/notification-feed/component'
import { NotificationFeedSchema } from '../components/workflow/notification-feed/schema'

vi.mock('../components/_base/useComponentData', () => ({
  useComponentData: vi.fn(() => ({ data: [], isLoading: false, error: null })),
}))

const action = { type: 'set-value', path: 'noop', value: true }
const cases = [
  [
    'ChatWindow',
    ChatWindowSchema,
    ChatWindow,
    { id: 'chat', data: { from: 'messages' }, currentUserId: 'me', onSendAction: action },
  ],
  [
    'CommentSection',
    CommentSectionSchema,
    CommentSection,
    { id: 'comments', data: { from: 'comments' } },
  ],
  ['EmojiPicker', EmojiPickerSchema, EmojiPicker, { id: 'emoji', onSelect: action }],
  ['Feed', FeedSchema, Feed, { id: 'feed', data: { from: 'feed' } }],
  ['GifPicker', GifPickerSchema, GifPicker, { id: 'gif', onSelect: action, sampleGifs: [] }],
  [
    'MessageThread',
    MessageThreadSchema,
    MessageThread,
    { id: 'messages', data: { from: 'messages' }, currentUserId: 'me' },
  ],
  ['ReactionBar', ReactionBarSchema, ReactionBar, { id: 'reactions', reactions: [] }],
  [
    'ReactionPicker',
    ReactionPickerSchema,
    ReactionPicker,
    { id: 'reaction-picker', onSelect: action },
  ],
  ['DatePicker', DatePickerSchema, DatePicker, { id: 'date' }],
  ['DateRangePicker', DateRangePickerSchema, DateRangePicker, { id: 'date-range' }],
  ['LocationInput', LocationInputSchema, LocationInput, { id: 'location' }],
  ['QuickAdd', QuickAddSchema, QuickAdd, { id: 'quick-add', onSubmit: action }],
  ['TimePicker', TimePickerSchema, TimePicker, { id: 'time' }],
  [
    'Wizard',
    WizardSchema,
    Wizard,
    { id: 'wizard', steps: [{ id: 'one', title: 'One', fields: [] }] },
  ],
  ['TreeView', TreeViewSchema, TreeView, { id: 'tree', data: [] }],
  ['AuditLog', AuditLogSchema, AuditLog, { id: 'audit', data: { from: 'audit' } }],
  ['Calendar', CalendarSchema, Calendar, { id: 'calendar' }],
  ['KanbanBoard', KanbanBoardSchema, KanbanBoard, { id: 'kanban', columns: [] }],
  [
    'NotificationFeed',
    NotificationFeedSchema,
    NotificationFeed,
    { id: 'notifications', data: { from: 'notifications' } },
  ],
] as const

describe('previously uncovered component conformance', () => {
  it.each(cases)(
    '%s parses its schema and exposes a stable test ID',
    (name, schema, Component, config) => {
      const parsed = schema.parse({ ...config, testID: `conformance-${name}` })
      const { getByTestId, toJSON } = renderWithProviders(<Component config={parsed as never} />)
      expect(toJSON()).toBeTruthy()
      expect(getByTestId(`conformance-${name}`)).toBeTruthy()
    },
  )
})
