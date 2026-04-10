import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import {
  BottomSheet,
  Modal,
  Toast,
  ActionSheet,
  Drawer,
  Popover,
  DropdownMenu,
  ContextMenu,
  ConfirmDialog,
  CommandPalette,
  Stack,
  Row,
  Body,
  useScreenContext,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

// Inner component so it can call useScreenContext (must be inside MockProviders)
function OverlayControls() {
  const { setValue } = useScreenContext()

  return (
    <Stack config={{ gap: 16 }}>
      <SectionLabel label="BottomSheet — share sheet" />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__sheet_share-sheet', true)}
        accessibilityRole="button"
        accessibilityLabel="Open share bottom sheet"
        testID="overlay-open-bottom-sheet"
      >
        <Text style={styles.triggerText}>Open Share Sheet</Text>
      </TouchableOpacity>

      <BottomSheet
        config={{
          id: 'share-sheet',
          snapPoints: ['40%', '70%'],
          title: 'Share Post',
          showHandle: true,
          closeOnBackdrop: true,
        }}
      >
        <Stack config={{ gap: 16, padding: 16 }}>
          <Body config={{ text: 'Choose how you want to share this post with your network.' }} />
          <Row config={{ gap: 8, justify: 'space-between', wrap: true }}>
            {['Twitter', 'LinkedIn', 'Email', 'Copy Link'].map((opt) => (
              <View key={opt} style={styles.shareOption}>
                <Text style={styles.shareOptionText}>{opt}</Text>
              </View>
            ))}
          </Row>
        </Stack>
      </BottomSheet>

      <SectionLabel label="BottomSheet — filter sheet (two snap points)" />
      <TouchableOpacity
        style={[styles.triggerButton, styles.triggerButtonPurple]}
        onPress={() => setValue('__sheet_filter-sheet', true)}
        accessibilityRole="button"
        accessibilityLabel="Open filter bottom sheet"
        testID="overlay-open-filter-sheet"
      >
        <Text style={[styles.triggerText, { color: '#fff' }]}>Open Filter Sheet</Text>
      </TouchableOpacity>

      <BottomSheet
        config={{
          id: 'filter-sheet',
          snapPoints: ['55%', '90%'],
          title: 'Filters',
          showHandle: true,
          closeOnBackdrop: true,
        }}
      >
        <Stack config={{ gap: 16, padding: 16 }}>
          <Body config={{ text: 'Filter options would appear here — category, price range, rating, distance.' }} />
          <Body config={{ text: 'Drag the handle to expand to full view.' }} />
        </Stack>
      </BottomSheet>

      <SectionLabel label="Modal — confirmation dialog" />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__modal_confirm-modal', true)}
        accessibilityRole="button"
        accessibilityLabel="Open confirmation modal"
        testID="overlay-open-modal"
      >
        <Text style={styles.triggerText}>Open Confirm Modal</Text>
      </TouchableOpacity>

      <Modal
        config={{
          id: 'confirm-modal',
          title: 'Delete Account',
          size: 'md',
          showCloseButton: true,
          closeOnBackdrop: true,
        }}
      >
        <Stack config={{ gap: 16, padding: 16 }}>
          <Body
            config={{
              text: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
              color: '#71717a',
            }}
          />
          <Row config={{ gap: 12, justify: 'flex-end' }}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setValue('__modal_confirm-modal', false)}
              accessibilityRole="button"
              testID="modal-cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.destructiveBtn}
              onPress={() => setValue('__modal_confirm-modal', false)}
              accessibilityRole="button"
              testID="modal-confirm-delete"
            >
              <Text style={styles.destructiveText}>Delete</Text>
            </TouchableOpacity>
          </Row>
        </Stack>
      </Modal>

      <SectionLabel label="Modal — info dialog (small)" />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__modal_info-modal', true)}
        accessibilityRole="button"
        accessibilityLabel="Open info modal"
        testID="overlay-open-info-modal"
      >
        <Text style={styles.triggerText}>Open Info Modal (sm)</Text>
      </TouchableOpacity>

      <Modal
        config={{
          id: 'info-modal',
          title: 'What is Pocketshot?',
          size: 'sm',
          showCloseButton: true,
        }}
      >
        <Stack config={{ gap: 12, padding: 16 }}>
          <Body config={{ text: 'Pocketshot is the React Native SDK for bunshot-powered backends.' }} />
        </Stack>
      </Modal>

      <SectionLabel label="Toast" />
      <Toast config={{ id: 'screen-toast', position: 'bottom' }} />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__toast', { message: 'Hello from Toast!', variant: 'success', duration: 3000, id: Date.now() })}
        accessibilityRole="button"
        accessibilityLabel="Trigger toast"
        testID="overlay-trigger-toast"
      >
        <Text style={styles.triggerText}>Trigger Toast</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__toast', { message: 'Something went wrong', variant: 'error', duration: 3000, id: Date.now() })}
        accessibilityRole="button"
        accessibilityLabel="Trigger error toast"
        testID="overlay-trigger-error-toast"
      >
        <Text style={styles.triggerText}>Trigger Error Toast</Text>
      </TouchableOpacity>

      <SectionLabel label="ActionSheet" />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() =>
          setValue('__actionSheet', {
            type: 'action-sheet',
            title: 'Post Options',
            options: [
              { label: 'Edit Post', action: { type: 'toast', message: 'Edit tapped' } },
              { label: 'Share', action: { type: 'toast', message: 'Share tapped' } },
              { label: 'Save to Collection', action: { type: 'toast', message: 'Saved!' } },
              { label: 'Report', action: { type: 'toast', message: 'Reported' }, destructive: true },
            ],
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Open action sheet"
        testID="overlay-open-action-sheet"
      >
        <Text style={styles.triggerText}>Open Action Sheet</Text>
      </TouchableOpacity>

      <ActionSheet config={{ id: 'demo-action-sheet' }} />

      <SectionLabel label="Drawer — left position" />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__drawer_left-drawer', true)}
        accessibilityRole="button"
        accessibilityLabel="Open left drawer"
        testID="overlay-open-left-drawer"
      >
        <Text style={styles.triggerText}>Open Left Drawer</Text>
      </TouchableOpacity>

      <Drawer
        config={{
          id: 'left-drawer',
          position: 'left',
          widthPercent: 80,
          title: 'Navigation',
          content: 'Browse your workspace, recent projects, and saved items from this panel.',
          showHandle: true,
          closeOnBackdrop: true,
        }}
      />

      <SectionLabel label="Drawer — right position" />
      <TouchableOpacity
        style={[styles.triggerButton, styles.triggerButtonPurple]}
        onPress={() => setValue('__drawer_right-drawer', true)}
        accessibilityRole="button"
        accessibilityLabel="Open right drawer"
        testID="overlay-open-right-drawer"
      >
        <Text style={[styles.triggerText, { color: '#fff' }]}>Open Right Drawer</Text>
      </TouchableOpacity>

      <Drawer
        config={{
          id: 'right-drawer',
          position: 'right',
          widthPercent: 75,
          title: 'Activity Feed',
          content: 'Recent activity across your team: comments, reviews, and deployments.',
          showHandle: true,
          closeOnBackdrop: true,
        }}
      />

      <SectionLabel label="Popover — with title and content" />
      <Popover
        config={{
          id: 'info-popover',
          triggerLabel: 'What is this?',
          title: 'Token System',
          content: 'Tokens are design primitives that drive all visual properties. Colors, spacing, typography, and radii are all token-driven.',
          position: 'bottom',
        }}
      />

      <SectionLabel label="Popover — content only" />
      <Popover
        config={{
          id: 'hint-popover',
          triggerLabel: 'Show Hint',
          content: 'Tap and hold any item to see additional options.',
          position: 'bottom',
        }}
      />

      <SectionLabel label="DropdownMenu — with destructive and disabled items" />
      <DropdownMenu
        config={{
          id: 'post-menu',
          trigger: { label: 'Post Options', icon: '⋯' },
          items: [
            { id: 'edit', label: 'Edit Post', icon: '✏️', onPress: { type: 'toast', message: 'Edit tapped' } },
            { id: 'duplicate', label: 'Duplicate', icon: '📋', onPress: { type: 'toast', message: 'Duplicated' } },
            { id: 'archive', label: 'Archive', icon: '📦', onPress: { type: 'toast', message: 'Archived' } },
            { id: 'export', label: 'Export as PDF', icon: '📄', onPress: { type: 'toast', message: 'Exporting...' }, disabled: true },
            { id: 'delete', label: 'Delete Post', icon: '🗑️', onPress: { type: 'toast', message: 'Deleted' }, destructive: true },
          ],
        }}
      />

      <SectionLabel label="DropdownMenu — simple" />
      <DropdownMenu
        config={{
          id: 'sort-menu',
          trigger: { label: 'Sort By' },
          items: [
            { id: 'newest', label: 'Newest First', onPress: { type: 'toast', message: 'Sorted by newest' } },
            { id: 'oldest', label: 'Oldest First', onPress: { type: 'toast', message: 'Sorted by oldest' } },
            { id: 'popular', label: 'Most Popular', onPress: { type: 'toast', message: 'Sorted by popularity' } },
          ],
          align: 'end',
        }}
      />

      <SectionLabel label="ContextMenu — long-press to open" />
      <ContextMenu
        config={{
          id: 'demo-context-menu',
          triggerLabel: 'Long-press this area to open the context menu',
          items: [
            { id: 'copy', label: 'Copy', icon: '📋', onPress: { type: 'toast', message: 'Copied' } },
            { id: 'paste', label: 'Paste', icon: '📌', onPress: { type: 'toast', message: 'Pasted' } },
            { id: 'select-all', label: 'Select All', icon: '✅', onPress: { type: 'toast', message: 'All selected' } },
            { id: 'delete', label: 'Delete', icon: '🗑️', onPress: { type: 'toast', message: 'Deleted' }, destructive: true },
          ],
        }}
      />

      <SectionLabel label="ConfirmDialog — default variant" />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__confirm_save-confirm', true)}
        accessibilityRole="button"
        accessibilityLabel="Open save confirmation dialog"
        testID="overlay-open-save-confirm"
      >
        <Text style={styles.triggerText}>Open Save Confirmation</Text>
      </TouchableOpacity>

      <ConfirmDialog
        config={{
          id: 'save-confirm',
          title: 'Save Changes',
          message: 'You have unsaved changes. Do you want to save before leaving?',
          confirmLabel: 'Save',
          cancelLabel: 'Discard',
          variant: 'default',
          onConfirm: { type: 'toast', message: 'Changes saved' },
          onCancel: { type: 'toast', message: 'Changes discarded' },
        }}
      />

      <SectionLabel label="ConfirmDialog — destructive variant" />
      <TouchableOpacity
        style={[styles.triggerButton, styles.triggerButtonPurple]}
        onPress={() => setValue('__confirm_delete-confirm', true)}
        accessibilityRole="button"
        accessibilityLabel="Open destructive confirmation dialog"
        testID="overlay-open-delete-confirm"
      >
        <Text style={[styles.triggerText, { color: '#fff' }]}>Open Delete Confirmation</Text>
      </TouchableOpacity>

      <ConfirmDialog
        config={{
          id: 'delete-confirm',
          title: 'Delete Project',
          message: 'This will permanently delete the project and all associated data. This action cannot be undone.',
          confirmLabel: 'Delete Project',
          cancelLabel: 'Keep Project',
          variant: 'destructive',
          onConfirm: { type: 'toast', message: 'Project deleted' },
          onCancel: { type: 'toast', message: 'Deletion cancelled' },
        }}
      />

      <SectionLabel label="CommandPalette — with grouped items" />
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setValue('__commandPalette_demo-palette', true)}
        accessibilityRole="button"
        accessibilityLabel="Open command palette"
        testID="overlay-open-command-palette"
      >
        <Text style={styles.triggerText}>Open Command Palette</Text>
      </TouchableOpacity>

      <CommandPalette
        config={{
          id: 'demo-palette',
          placeholder: 'Search commands...',
          items: [
            { id: 'new-project', label: 'New Project', description: 'Create a new project from scratch', icon: '📁', group: 'Create', onSelect: { type: 'toast', message: 'New project' } },
            { id: 'new-file', label: 'New File', description: 'Add a file to the current project', icon: '📄', group: 'Create', onSelect: { type: 'toast', message: 'New file' } },
            { id: 'search', label: 'Search Files', description: 'Find files across all projects', icon: '🔍', group: 'Navigation', shortcut: '⌘P', onSelect: { type: 'toast', message: 'Searching...' } },
            { id: 'goto-settings', label: 'Go to Settings', description: 'Open application settings', icon: '⚙️', group: 'Navigation', shortcut: '⌘,', onSelect: { type: 'toast', message: 'Opening settings' } },
            { id: 'toggle-theme', label: 'Toggle Theme', description: 'Switch between light and dark mode', icon: '🌗', group: 'Appearance', onSelect: { type: 'toast', message: 'Theme toggled' } },
            { id: 'export', label: 'Export Data', description: 'Export project data as JSON', icon: '📤', group: 'Actions', onSelect: { type: 'toast', message: 'Exporting...' } },
          ],
          maxResults: 10,
        }}
      />
    </Stack>
  )
}

export default function OverlayShowcase() {
  return (
    <ShowcaseScreen title="Overlay">
      <MockProviders>
        <OverlayControls />
      </MockProviders>
    </ShowcaseScreen>
  )
}

const styles = StyleSheet.create({
  triggerButton: {
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  triggerButtonPurple: { backgroundColor: '#7c3aed' },
  triggerText: { fontSize: 15, fontWeight: '600', color: '#18181b' },
  shareOption: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  shareOptionText: { fontSize: 12, color: '#18181b' },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
  },
  cancelText: { fontSize: 14, fontWeight: '500', color: '#18181b' },
  destructiveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  destructiveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
})
