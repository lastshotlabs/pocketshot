import { createHash } from 'node:crypto'
import React, { type ReactElement } from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it, vi, type Mock } from 'vitest'
import { ChatWindowBase } from '../../../src/ui/components/communication/chat-window/standalone'
import { CommentSectionBase } from '../../../src/ui/components/communication/comment-section/standalone'
import { EmojiPickerBase } from '../../../src/ui/components/communication/emoji-picker/standalone'
import { FeedBase } from '../../../src/ui/components/communication/feed/standalone'
import { GifPickerBase } from '../../../src/ui/components/communication/gif-picker/standalone'
import { MessageThreadBase } from '../../../src/ui/components/communication/message-thread/standalone'
import { ReactionBarBase } from '../../../src/ui/components/communication/reaction-bar/standalone'
import { ReactionPickerBase } from '../../../src/ui/components/communication/reaction-picker/standalone'
import { DatePickerBase } from '../../../src/ui/components/forms/date-picker/standalone'
import { DateRangePickerBase } from '../../../src/ui/components/forms/date-range-picker/standalone'
import { LocationInputBase } from '../../../src/ui/components/forms/location-input/standalone'
import { QuickAddBase } from '../../../src/ui/components/forms/quick-add/standalone'
import { TimePickerBase } from '../../../src/ui/components/forms/time-picker/standalone'
import { WizardBase } from '../../../src/ui/components/forms/wizard/standalone'
import { TreeViewBase } from '../../../src/ui/components/navigation/tree-view/standalone'
import { AuditLogBase } from '../../../src/ui/components/workflow/audit-log/standalone'
import { CalendarBase } from '../../../src/ui/components/workflow/calendar/standalone'
import { KanbanBoardBase } from '../../../src/ui/components/workflow/kanban-board/standalone'
import { NotificationFeedBase } from '../../../src/ui/components/workflow/notification-feed/standalone'
import { renderWithProviders, type RenderResult } from './renderWithProviders'

export type ComplexComponentName = keyof typeof suites

interface SuiteSpies {
  primary: Mock
  secondary: Mock
}

interface ControlExpectation {
  testID: string
  role: string
  label: string | RegExp
}

interface SuiteDefinition {
  render: (spies: SuiteSpies) => ReactElement
  anchorTestID: string
  expectedText: string
  control: ControlExpectation
  interact: (result: RenderResult, spies: SuiteSpies) => void | Promise<void>
  baseline: string
  alternate?: (spies: SuiteSpies) => ReactElement
  alternateText?: string
}

const fixedDate = '2024-01-15T12:00:00.000Z'

const suites = {
  'chat-window': {
    render: (spies) => (
      <ChatWindowBase
        messages={[
          {
            id: 'm1',
            content: 'Hello from Ada',
            senderId: 'ada',
            senderName: 'Ada',
            createdAt: fixedDate,
            status: 'read',
          },
        ]}
        currentUserId="me"
        onSend={spies.primary}
        onAttach={spies.secondary}
        testID="chat"
      />
    ),
    anchorTestID: 'chat',
    expectedText: 'Hello from Ada',
    control: { testID: 'chat-attach', role: 'button', label: 'Attach file' },
    interact: (result, spies) => {
      press(result, 'chat-attach')
      expect(spies.secondary).toHaveBeenCalledOnce()
    },
    alternate: (spies) => (
      <ChatWindowBase
        messages={[]}
        currentUserId="me"
        onSend={spies.primary}
        loading
        testID="chat"
      />
    ),
    alternateText: '',
    baseline: 'c3cbaf327b3fc56de1d056b020d8d7a70f05dd0eccb0f4daedfbf97bd6e418b7',
  },
  'comment-section': {
    render: (spies) => (
      <CommentSectionBase
        comments={[
          {
            id: 'c1',
            author: { name: 'Ada' },
            content: 'A useful comment',
            timestamp: fixedDate,
            likes: 2,
          },
        ]}
        currentUserId="me"
        onLike={spies.primary}
        onSubmit={spies.secondary}
        testID="comments"
      />
    ),
    anchorTestID: 'comments',
    expectedText: 'A useful comment',
    control: { testID: 'comments-comment-c1-like', role: 'button', label: /Like comment/ },
    interact: (result, spies) => {
      press(result, 'comments-comment-c1-like')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    alternate: (spies) => (
      <CommentSectionBase comments={[]} onSubmit={spies.secondary} testID="comments" />
    ),
    alternateText: 'No comments yet',
    baseline: '5547391806f6632c0402cd6427ba0dc84725bf0d1db4788f95fb82a9efad5640',
  },
  'emoji-picker': {
    render: (spies) => (
      <EmojiPickerBase
        visible
        onClose={spies.secondary}
        onSelect={spies.primary}
        categoryData={[{ name: 'Smileys', emojis: ['😀'] }]}
        testID="emoji"
      />
    ),
    anchorTestID: 'emoji',
    expectedText: '😀',
    control: { testID: 'emoji-emoji-😀', role: 'button', label: 'Select emoji 😀' },
    interact: (result, spies) => {
      press(result, 'emoji-emoji-😀')
      expect(spies.primary).toHaveBeenCalledWith('😀')
    },
    baseline: '93b549923738e2e909561857f088fb42c2b63dec87f4f6e42f1966451317bd3c',
  },
  feed: {
    render: (spies) => (
      <FeedBase
        items={[
          { id: 'f1', title: 'Release update', body: 'Ready to test', author: { name: 'Ada' } },
        ]}
        onItemPress={spies.primary}
        testID="feed"
      />
    ),
    anchorTestID: 'feed-list',
    expectedText: 'Release update',
    control: { testID: 'feed-item-f1', role: 'button', label: 'Release update' },
    interact: (result, spies) => {
      press(result, 'feed-item-f1')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    alternate: (spies) => <FeedBase items={[]} onItemPress={spies.primary} testID="feed" />,
    alternateText: 'Nothing here yet',
    baseline: '3030b6c5ccfb8ee0985e5956e83afc895a95fdbff1cc73bc359c9c87471ba933',
  },
  'gif-picker': {
    render: (spies) => (
      <GifPickerBase
        visible
        onClose={spies.secondary}
        onSelect={spies.primary}
        sampleGifs={[
          {
            id: 'g1',
            url: 'https://example.test/gif',
            preview: 'https://example.test/preview',
            width: 100,
            height: 100,
          },
        ]}
        provider="giphy"
        testID="gif"
      />
    ),
    anchorTestID: 'gif',
    expectedText: 'Powered by GIPHY',
    control: { testID: 'gif-gif-g1', role: 'button', label: 'Select GIF' },
    interact: (result, spies) => {
      press(result, 'gif-gif-g1')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    baseline: '7ffdb3c94616c2f671ca0fe7517a039d461905404a91cf00d64c54efe8693eed',
  },
  'message-thread': {
    render: (spies) => (
      <MessageThreadBase
        messages={[
          {
            id: 'm1',
            content: 'Thread message',
            senderId: 'ada',
            senderName: 'Ada',
            createdAt: fixedDate,
          },
        ]}
        currentUserId="me"
        onReply={spies.primary}
        testID="thread"
      />
    ),
    anchorTestID: 'thread-list',
    expectedText: 'Thread message',
    control: {
      testID: 'message-bubble-m1',
      role: 'text',
      label: 'Message from Ada: Thread message',
    },
    interact: (result, spies) => {
      longPress(result, 'message-bubble-m1')
      press(result, 'message-reply-m1')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    alternate: (spies) => (
      <MessageThreadBase
        messages={[]}
        currentUserId="me"
        onReply={spies.primary}
        error
        testID="thread"
      />
    ),
    alternateText: 'Failed to load messages',
    baseline: '46e867857cfab20bd4c4e3f241e7422a701f64c117d7599581165283a3dbf4bb',
  },
  'reaction-bar': {
    render: (spies) => (
      <ReactionBarBase
        reactions={[{ emoji: '👍', label: 'thumbs up', count: 3, reacted: false }]}
        onReact={spies.primary}
        testID="bar"
      />
    ),
    anchorTestID: 'bar-scroll',
    expectedText: '👍',
    control: {
      testID: 'bar-reaction-0',
      role: 'togglebutton',
      label: 'React with thumbs up, 3 reactions',
    },
    interact: (result, spies) => {
      press(result, 'bar-reaction-0')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    baseline: 'cab74d9b3e253a7513f0cf5a8ccef1b6c03c254751518a578fd8e40a219b3391',
  },
  'reaction-picker': {
    render: (spies) => (
      <ReactionPickerBase
        visible
        reactions={['👍']}
        onClose={spies.secondary}
        onSelect={spies.primary}
        testID="picker"
      />
    ),
    anchorTestID: 'picker',
    expectedText: '👍',
    control: { testID: 'picker-reaction-0', role: 'button', label: 'React with 👍' },
    interact: (result, spies) => {
      press(result, 'picker-reaction-0')
      expect(spies.primary).toHaveBeenCalledWith('👍')
    },
    baseline: '09ca3b7948381be0fabe36e712c4dd7ad7eaed0e831640b8393649b78eddf5ea',
  },
  'date-picker': {
    render: (spies) => (
      <DatePickerBase
        defaultValue="2024-01-15"
        label="Birthday"
        onChange={spies.primary}
        testID="date"
      />
    ),
    anchorTestID: 'date',
    expectedText: 'Birthday',
    control: { testID: 'date', role: 'button', label: 'Birthday' },
    interact: (result, spies) => {
      press(result, 'date')
      press(result, 'date-day-2024-01-16')
      expect(spies.primary).toHaveBeenCalledWith('2024-01-16')
    },
    baseline: '14b5c417c8ad053b44e38ac370add5960d8739b5c64db86a0858aa03cefc528f',
  },
  'date-range-picker': {
    render: (spies) => (
      <DateRangePickerBase
        defaultStart="2024-01-15"
        defaultEnd="2024-01-20"
        label="Stay"
        onChange={spies.primary}
        testID="range"
      />
    ),
    anchorTestID: 'range',
    expectedText: 'Stay',
    control: { testID: 'range', role: 'button', label: 'Stay' },
    interact: (result) => {
      press(result, 'range')
      const before = visualHash(result)
      press(result, 'range-next-month')
      expect(visualHash(result)).not.toBe(before)
    },
    baseline: '1b8b6ec1faf47e5350b1e63eee399da9c5dc65502ceb7122c73df5b5f99cd36d',
  },
  'location-input': {
    render: (spies) => (
      <LocationInputBase
        defaultValue={{ latitude: 40, longitude: -74, address: 'Old address' }}
        label="Location"
        onChange={spies.primary}
        testID="location"
      />
    ),
    anchorTestID: 'location-address',
    expectedText: 'Location',
    control: { testID: 'location-current', role: 'button', label: 'Use current location' },
    interact: (result, spies) => {
      changeText(result, 'location-address', 'New address')
      expect(spies.primary).toHaveBeenCalledWith({
        latitude: 40,
        longitude: -74,
        address: 'New address',
      })
    },
    baseline: 'e5a7eda59f1fbf1f2eeabb028d70d085d35727f159e24e14158049cdb68f0d33',
  },
  'quick-add': {
    render: (spies) => (
      <QuickAddBase
        placeholder="Add task"
        submitLabel="Add"
        onSubmit={spies.primary}
        testID="quick"
      />
    ),
    anchorTestID: 'quick-input',
    expectedText: 'Add',
    control: { testID: 'quick-submit', role: 'button', label: 'Add' },
    interact: (result, spies) => {
      changeText(result, 'quick-input', 'Ship it')
      press(result, 'quick-submit')
      expect(spies.primary).toHaveBeenCalledWith('Ship it')
    },
    baseline: '3191115f275439786361dab6baa922e20532b6625ee18a72fba089de810d87ab',
  },
  'time-picker': {
    render: (spies) => (
      <TimePickerBase
        defaultValue="09:30"
        label="Reminder"
        minuteInterval={15}
        onChange={spies.primary}
        testID="time"
      />
    ),
    anchorTestID: 'time',
    expectedText: 'Reminder',
    control: { testID: 'time', role: 'button', label: 'Reminder' },
    interact: (result, spies) => {
      press(result, 'time')
      press(result, 'time-confirm')
      expect(spies.primary).toHaveBeenCalledWith('09:30')
    },
    baseline: 'fc1449acaa15df78155c347a145188acc5bb4ef5dbe9f2a900aec2e02b5bf80e',
  },
  wizard: {
    render: (spies) => (
      <WizardBase
        id="setup"
        title="Setup"
        steps={[
          { id: 'one', title: 'First', fields: [] },
          { id: 'two', title: 'Second', fields: [] },
        ]}
        onComplete={spies.primary}
        testID="wizard"
      />
    ),
    anchorTestID: 'wizard-setup-next',
    expectedText: 'First',
    control: { testID: 'wizard-setup-next', role: 'button', label: 'Next' },
    interact: (result, spies) => {
      press(result, 'wizard-setup-next')
      press(result, 'wizard-setup-submit')
      expect(spies.primary).toHaveBeenCalledWith({})
    },
    baseline: '6192826a3677e054eb74a5340275f8f0eeb54616250b5331324193099a53535e',
  },
  'tree-view': {
    render: (spies) => (
      <TreeViewBase
        data={[{ id: 'root', label: 'Root', children: [{ id: 'leaf', label: 'Leaf' }] }]}
        defaultExpandedIds={['root']}
        onItemPress={spies.primary}
        testID="tree"
      />
    ),
    anchorTestID: 'tree-list',
    expectedText: 'Leaf',
    control: { testID: 'tree-item-root', role: 'menuitem', label: 'Root' },
    interact: (result, spies) => {
      press(result, 'tree-item-root')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    baseline: 'da02c15793f1f933b73efc636e865cc47a5b49e7e1776ae2749d9ab19e685978',
  },
  'audit-log': {
    render: (spies) => (
      <AuditLogBase
        entries={[
          {
            id: 'a1',
            actor: { name: 'Ada' },
            action: 'updated',
            target: 'Release',
            createdAt: fixedDate,
          },
        ]}
        groupByDate={false}
        onItemPress={spies.primary}
        testID="audit"
      />
    ),
    anchorTestID: 'audit',
    expectedText: 'Ada updated Release',
    control: { testID: 'audit-entry-a1', role: 'button', label: 'Ada updated Release' },
    interact: (result, spies) => {
      press(result, 'audit-entry-a1')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    alternate: (spies) => (
      <AuditLogBase
        entries={[]}
        onItemPress={spies.primary}
        emptyMessage="No audit entries"
        testID="audit"
      />
    ),
    alternateText: 'No audit entries',
    baseline: '2933a9673387a86ada1659cd6eb98a2c047946cdb7cae15309fc8b434c24296e',
  },
  calendar: {
    render: (spies) => (
      <CalendarBase
        defaultDate="2024-01-15"
        events={[{ date: '2024-01-15', title: 'Release' }]}
        onDateChange={spies.primary}
        testID="calendar"
      />
    ),
    anchorTestID: 'calendar',
    expectedText: 'January 2024',
    control: { testID: 'calendar-day-2024-01-15', role: 'button', label: /2024-01-15/ },
    interact: (result, spies) => {
      press(result, 'calendar-day-2024-01-16')
      expect(spies.primary).toHaveBeenCalledWith('2024-01-16')
    },
    baseline: '77cbb1266e05ebede3b1829583b994cc62366cccae05d7b1aa1744b1d1675d66',
  },
  'kanban-board': {
    render: (spies) => (
      <KanbanBoardBase
        columns={[
          {
            id: 'todo',
            title: 'To do',
            items: [{ id: 'k1', title: 'Certify release', priority: 'high' }],
          },
        ]}
        onCardPress={spies.primary}
        testID="kanban"
      />
    ),
    anchorTestID: 'kanban-scroll',
    expectedText: 'Certify release',
    control: { testID: 'kanban-card-k1', role: 'button', label: 'Certify release, priority high' },
    interact: (result, spies) => {
      press(result, 'kanban-card-k1')
      expect(spies.primary).toHaveBeenCalledOnce()
    },
    baseline: 'cceebfc2bf82564bfd2ced198f27ecd184e0c7481370ab49a40877feeaa6cb92',
  },
  'notification-feed': {
    render: (spies) => (
      <NotificationFeedBase
        notifications={[
          {
            id: 'n1',
            title: 'Build ready',
            body: 'Install it',
            type: 'success',
            isRead: false,
            createdAt: fixedDate,
          },
        ]}
        onItemPress={spies.primary}
        onMarkAllRead={spies.secondary}
        testID="notifications"
      />
    ),
    anchorTestID: 'notifications',
    expectedText: 'Build ready',
    control: {
      testID: 'notifications-mark-all-read',
      role: 'button',
      label: /Mark all 1 notifications as read/,
    },
    interact: (result, spies) => {
      press(result, 'notifications-mark-all-read')
      expect(spies.secondary).toHaveBeenCalledOnce()
    },
    alternate: (spies) => (
      <NotificationFeedBase
        notifications={[]}
        onItemPress={spies.primary}
        emptyMessage="No notifications"
        testID="notifications"
      />
    ),
    alternateText: 'No notifications',
    baseline: '7bf5e16a5fde4a7c735a1c5c8e8a62c0d7e7bd41ff5698f81f80d457a3e61e86',
  },
} satisfies Record<string, SuiteDefinition>

export function defineComplexComponentSuite(name: ComplexComponentName): void {
  const suite: SuiteDefinition = suites[name]
  describe(`${name} behavior contract`, () => {
    it('renders representative content and its stable test target', () => {
      const result = render(suite)
      expect(result.getByTestId(suite.anchorTestID)).toBeTruthy()
      expect(result.getByText(suite.expectedText)).toBeTruthy()
    })

    it('gives the primary interaction a role and accessible name', () => {
      const result = render(suite)
      const control = hostControl(result, suite.control.testID)
      expect(control.props.accessibilityRole).toBe(suite.control.role)
      expect(control.props.accessibilityLabel).toEqual(
        typeof suite.control.label === 'string'
          ? suite.control.label
          : expect.stringMatching(suite.control.label),
      )
    })

    it('executes its primary interaction behavior', async () => {
      const spies = makeSpies()
      const result = renderWithProviders(suite.render(spies))
      await suite.interact(result, spies)
    })

    it('matches its compact structural visual baseline', () => {
      const result = render(suite)
      expect(visualHash(result)).toBe(suite.baseline)
    })

    if (suite.alternate && suite.alternateText !== undefined) {
      it('renders its empty, loading, or error state', () => {
        const result = renderWithProviders(suite.alternate!(makeSpies()))
        if (suite.alternateText) expect(result.getByText(suite.alternateText)).toBeTruthy()
        else expect(result.toJSON()).toBeTruthy()
      })
    }
  })
}

function makeSpies(): SuiteSpies {
  return { primary: vi.fn(), secondary: vi.fn() }
}

function render(suite: SuiteDefinition): RenderResult {
  return renderWithProviders(suite.render(makeSpies()))
}

function hostControl(result: RenderResult, testID: string) {
  const controls = result.instance.root.findAll(
    (node) =>
      node.props.testID === testID &&
      typeof node.props.accessibilityRole === 'string' &&
      typeof node.type === 'string',
  )
  if (!controls[0]) throw new Error(`Unable to find accessible host control: ${testID}`)
  return controls[0]
}

function press(result: RenderResult, testID: string): void {
  const control = result.instance.root.findAll(
    (node) =>
      node.props.testID === testID &&
      typeof node.props.onPress === 'function' &&
      typeof node.type === 'string',
  )[0]
  if (!control) throw new Error(`Unable to find pressable control: ${testID}`)
  act(() => control.props.onPress())
}

function longPress(result: RenderResult, testID: string): void {
  const control = result.instance.root.findAll(
    (node) =>
      node.props.testID === testID &&
      typeof node.props.onLongPress === 'function' &&
      typeof node.type === 'string',
  )[0]
  if (!control) throw new Error(`Unable to find long-press control: ${testID}`)
  act(() => control.props.onLongPress())
}

function changeText(result: RenderResult, testID: string, value: string): void {
  const input = result.instance.root.findAll(
    (node) =>
      node.props.testID === testID &&
      typeof node.props.onChangeText === 'function' &&
      typeof node.type === 'string',
  )[0]
  if (!input) throw new Error(`Unable to find text input: ${testID}`)
  act(() => input.props.onChangeText(value))
}

function visualHash(result: RenderResult): string {
  return createHash('sha256').update(JSON.stringify(result.toJSON())).digest('hex')
}
