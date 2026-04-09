import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import {
  BottomSheet,
  Modal,
  Toast,
  ActionSheet,
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
