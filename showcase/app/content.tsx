import { View, StyleSheet } from 'react-native'
import {
  Heading,
  Body,
  Label,
  Link,
  Image,
  Stack,
  Divider,
  Markdown,
  CodeBlock,
  RichInput,
  FileUploader,
  LinkEmbed,
  RichTextViewer,
  RichTextEditor,
  ImageViewer,
  MediaPicker,
  VideoPlayer,
  AudioPlayer,
  QrCode,
  QrScanner,
  CompareView,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function ContentShowcase() {
  return (
    <ShowcaseScreen title="Content">
      <MockProviders>
        <SectionLabel label="Heading — levels 1–6" />
        <Stack config={{ gap: 4 }}>
          <Heading config={{ text: 'Heading Level 1', level: 1 }} />
          <Heading config={{ text: 'Heading Level 2', level: 2 }} />
          <Heading config={{ text: 'Heading Level 3', level: 3 }} />
          <Heading config={{ text: 'Heading Level 4', level: 4 }} />
          <Heading config={{ text: 'Heading Level 5', level: 5 }} />
          <Heading config={{ text: 'Heading Level 6', level: 6 }} />
        </Stack>

        <SectionLabel label="Heading — alignment" />
        <Stack config={{ gap: 4 }}>
          <Heading config={{ text: 'Left aligned (default)', level: 3, align: 'left' }} />
          <Heading config={{ text: 'Center aligned', level: 3, align: 'center' }} />
          <Heading config={{ text: 'Right aligned', level: 3, align: 'right' }} />
        </Stack>

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="Body — sizes" />
        <Stack config={{ gap: 8 }}>
          <Body config={{ text: 'Body small — The quick brown fox jumps over the lazy dog.', size: 'sm' }} />
          <Body config={{ text: 'Body medium — The quick brown fox jumps over the lazy dog.', size: 'md' }} />
          <Body config={{ text: 'Body large — The quick brown fox jumps over the lazy dog.', size: 'lg' }} />
        </Stack>

        <SectionLabel label="Body — weights" />
        <Stack config={{ gap: 8 }}>
          <Body config={{ text: 'Regular weight', weight: 'regular' }} />
          <Body config={{ text: 'Medium weight', weight: 'medium' }} />
          <Body config={{ text: 'Semibold weight', weight: 'semibold' }} />
          <Body config={{ text: 'Bold weight', weight: 'bold' }} />
        </Stack>

        <SectionLabel label="Body — truncation" />
        <Body
          config={{
            text: 'This is a very long paragraph that will be truncated after two lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            numberOfLines: 2,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="Label — variants" />
        <Stack config={{ gap: 6 }}>
          <Label config={{ text: 'Default label', variant: 'default' }} />
          <Label config={{ text: 'Muted label', variant: 'muted' }} />
          <Label config={{ text: 'Error label', variant: 'error' }} />
          <Label config={{ text: 'Success label', variant: 'success' }} />
        </Stack>

        <SectionLabel label="Label — sizes + uppercase" />
        <Stack config={{ gap: 6 }}>
          <Label config={{ text: 'Extra small', size: 'xs' }} />
          <Label config={{ text: 'Small', size: 'sm' }} />
          <Label config={{ text: 'Medium', size: 'md' }} />
          <Label config={{ text: 'Uppercase label', size: 'sm', uppercase: true }} />
        </Stack>

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="Link" />
        <Stack config={{ gap: 8 }}>
          <Link
            config={{
              text: 'View terms and conditions',
              action: { type: 'open-url', url: 'https://example.com/terms' },
              size: 'md',
            }}
          />
          <Link
            config={{
              text: 'Privacy Policy',
              action: { type: 'open-url', url: 'https://example.com/privacy' },
              size: 'sm',
              underline: false,
            }}
          />
          <Link
            config={{
              text: 'Large link — Learn more about Pocketshot',
              action: { type: 'open-url', url: 'https://lastshotlabs.com' },
              size: 'lg',
            }}
          />
        </Stack>

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="Image — cover (16:9)" />
        <Image
          config={{
            src: 'https://picsum.photos/seed/pocketshot/800/450',
            alt: 'Scenic landscape',
            width: '100%',
            height: 200,
            resizeMode: 'cover',
            radius: 'lg',
          }}
        />

        <SectionLabel label="Image — avatar style (square, circle radius)" />
        <Image
          config={{
            src: 'https://picsum.photos/seed/avatar1/200/200',
            alt: 'User avatar',
            width: 80,
            height: 80,
            resizeMode: 'cover',
            radius: 'full',
          }}
        />

        <SectionLabel label="Image — contain mode" />
        <View style={styles.imageContainer}>
          <Image
            config={{
              src: 'https://picsum.photos/seed/logo/400/200',
              alt: 'Product logo',
              width: '100%',
              height: 120,
              resizeMode: 'contain',
              radius: 'md',
            }}
          />
        </View>

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="Markdown — rich content" />
        <Markdown
          config={{
            content:
              '# Welcome to Pocketshot\n\nThis is a **bold** and *italic* text example.\n\n## Features\n\n- Config-driven UI\n- 80+ components\n- Token system\n\n> Mobile-first, always.\n\n`inline code` and:\n\n```\nconst app = createPocketshot({ apiUrl })\n```',
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="CodeBlock — TypeScript with line numbers" />
        <CodeBlock
          config={{
            code: "import { createPocketshot } from '@lastshotlabs/pocketshot'\n\nconst pocket = createPocketshot({\n  apiUrl: 'https://api.example.com',\n  appName: 'MyApp',\n})\n\nexport const { useLogin, useUser, useLogout } = pocket",
            language: 'typescript',
            showLineNumbers: true,
          }}
        />

        <SectionLabel label="CodeBlock — JSON without line numbers" />
        <CodeBlock
          config={{
            code: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "@lastshotlabs/pocketshot": "^0.9.0"\n  }\n}',
            language: 'json',
            showLineNumbers: false,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="RichInput — default toolbar" />
        <RichInput
          config={{
            id: 'rich-input-default',
            placeholder: 'Write something...',
            label: 'Comment',
          }}
        />

        <SectionLabel label="RichInput — all toolbar options" />
        <RichInput
          config={{
            id: 'rich-input-full',
            placeholder: 'Compose your message...',
            label: 'Full Editor',
            toolbar: [
              'bold',
              'italic',
              'underline',
              'strikethrough',
              'code',
              'list-bullet',
              'list-number',
              'link',
              'quote',
            ],
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="FileUploader — images only" />
        <FileUploader
          config={{
            id: 'file-uploader-images',
            label: 'Upload Photos',
            accept: 'image',
            multiple: true,
            maxFiles: 4,
            maxSizeMb: 5,
          }}
        />

        <SectionLabel label="FileUploader — any file type" />
        <FileUploader
          config={{
            id: 'file-uploader-any',
            label: 'Attach Files',
            accept: 'any',
            multiple: true,
            maxFiles: 10,
            maxSizeMb: 25,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="LinkEmbed — YouTube" />
        <LinkEmbed
          config={{
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Building Config-Driven Mobile Apps with Pocketshot',
            description: 'A deep dive into how Pocketshot turns JSON manifests into native iOS and Android screens.',
            videoId: 'dQw4w9WgXcQ',
          }}
        />

        <SectionLabel label="LinkEmbed — Twitter / X" />
        <LinkEmbed
          config={{
            url: 'https://x.com/lastshotlabs/status/123456',
            authorName: 'LastShot Labs',
            authorHandle: 'lastshotlabs',
            tweetText: 'Just shipped Pocketshot 2.0 — 125 config-driven components, 8 design flavors, and full manifest-to-native rendering. The mobile SDK that actually has parity with web. 🚀',
            metrics: { likes: 2430, retweets: 312, replies: 89 },
          }}
        />

        <SectionLabel label="LinkEmbed — GitHub" />
        <LinkEmbed
          config={{
            url: 'https://github.com/lastshotlabs/pocketshot',
            repoOwner: 'lastshotlabs',
            repoName: 'pocketshot',
            repoDescription: 'React Native/Expo SDK for bunshot-powered backends. 125 config-addressable components, token-based theming, and CLI code generation from OpenAPI specs.',
            language: 'TypeScript',
            languageColor: '#3178C6',
            stars: 4821,
            forks: 387,
          }}
        />

        <SectionLabel label="LinkEmbed — Spotify" />
        <LinkEmbed
          config={{
            url: 'https://open.spotify.com/track/example',
            trackName: 'Midnight City',
            artistName: 'M83',
            albumArtUrl: 'https://picsum.photos/seed/spotify/300/300',
            durationMs: 243000,
          }}
        />

        <SectionLabel label="LinkEmbed — Figma" />
        <LinkEmbed
          config={{
            url: 'https://www.figma.com/file/abc123/Pocketshot-Design-System',
            fileName: 'Pocketshot Design System',
            lastModified: 'April 8, 2026',
            thumbnailUrl: 'https://picsum.photos/seed/figma/800/400',
          }}
        />

        <SectionLabel label="LinkEmbed — generic URL" />
        <LinkEmbed
          config={{
            url: 'https://lastshotlabs.com/blog/config-driven-ui',
            title: 'Config-Driven UI: Build Mobile Apps Without Code',
            description: 'Learn how Pocketshot turns JSON manifests into fully native React Native screens.',
            imageUrl: 'https://picsum.photos/seed/linkembed1/800/400',
            favicon: '🚀',
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="RichTextViewer — rendered rich text" />
        <RichTextViewer
          config={{
            content:
              '<h2>Release Notes v2.4</h2><p>We shipped <strong>config-driven theming</strong> with full dark mode support. Key changes:</p><ul><li>Token system now resolves at runtime</li><li>All 80+ components respect flavor overrides</li><li>New <em>CompareView</em> component for diffs</li></ul><p>See the <a href="https://docs.example.com">full docs</a> for details.</p>',
          }}
        />

        <SectionLabel label="RichTextViewer — truncated with expand" />
        <RichTextViewer
          config={{
            content:
              '<p>This is a long block of rich text content that should be truncated after a few lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>',
            maxLines: 3,
            showExpandButton: true,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="RichTextEditor — default toolbar" />
        <RichTextEditor
          config={{
            id: 'rich-editor-default',
            placeholder: 'Start writing your article...',
          }}
        />

        <SectionLabel label="RichTextEditor — full toolbar" />
        <RichTextEditor
          config={{
            id: 'rich-editor-full',
            placeholder: 'Compose with all formatting options...',
            toolbar: [
              'heading',
              'bold',
              'italic',
              'underline',
              'list-bullet',
              'list-number',
              'blockquote',
              'code',
              'link',
              'image',
            ],
            minHeight: 160,
            maxHeight: 500,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="ImageViewer — zoomable image" />
        <ImageViewer
          config={{
            source: 'https://picsum.photos/400/300',
            alt: 'Mountain landscape at sunset',
            enableZoom: true,
            maxZoom: 3,
          }}
        />

        <SectionLabel label="ImageViewer — fixed dimensions, no zoom" />
        <ImageViewer
          config={{
            source: 'https://picsum.photos/seed/arch/400/300',
            alt: 'Architecture detail',
            width: 300,
            height: 200,
            enableZoom: false,
            showCloseButton: false,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="MediaPicker — single image" />
        <MediaPicker
          config={{
            id: 'media-picker-single',
            mediaTypes: ['image'],
            maxSelections: 1,
            quality: 0.8,
            onSelect: { type: 'toast', message: 'Image selected' },
          }}
        />

        <SectionLabel label="MediaPicker — multiple media types" />
        <MediaPicker
          config={{
            id: 'media-picker-multi',
            mediaTypes: ['image', 'video', 'document'],
            maxSelections: 5,
            quality: 0.7,
            onSelect: { type: 'toast', message: 'Media selected' },
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="VideoPlayer — with poster" />
        <VideoPlayer
          config={{
            source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            poster: 'https://picsum.photos/seed/vidposter/800/450',
            controls: true,
            aspectRatio: 1.78,
          }}
        />

        <SectionLabel label="VideoPlayer — muted, looping" />
        <VideoPlayer
          config={{
            source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            muted: true,
            loop: true,
            controls: true,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="AudioPlayer — podcast episode" />
        <AudioPlayer
          config={{
            source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            title: 'Building Config-Driven Mobile Apps',
            artist: 'LastShot Labs Podcast',
            showWaveform: true,
          }}
        />

        <SectionLabel label="AudioPlayer — minimal" />
        <AudioPlayer
          config={{
            source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            title: 'Notification Sound',
            showWaveform: false,
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="QrCode — URL" />
        <QrCode
          config={{
            value: 'https://lastshotlabs.com/download',
            size: 200,
            errorCorrectionLevel: 'M',
          }}
        />

        <SectionLabel label="QrCode — styled with logo" />
        <QrCode
          config={{
            value: 'https://lastshotlabs.com/invite/abc123',
            size: 240,
            color: '#1e293b',
            backgroundColor: '#f8fafc',
            logo: 'https://picsum.photos/seed/logo/60/60',
            errorCorrectionLevel: 'H',
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="QrScanner — with overlay" />
        <QrScanner
          config={{
            id: 'qr-scanner-demo',
            onScan: { type: 'toast', message: 'QR code scanned' },
            showOverlay: true,
            overlayText: 'Point your camera at a QR code',
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="CompareView — side by side code diff" />
        <CompareView
          config={{
            left: {
              label: 'Before',
              content:
                'function greet(name) {\n  console.log("Hello " + name)\n  return name\n}',
            },
            right: {
              label: 'After',
              content:
                'function greet(name: string): string {\n  console.log(`Hello ${name}`)\n  return name\n}',
            },
            mode: 'side-by-side',
            showLineNumbers: true,
            highlightDiffs: true,
          }}
        />

        <SectionLabel label="CompareView — inline diff" />
        <CompareView
          config={{
            left: {
              label: 'Original',
              content:
                'const config = {\n  apiUrl: "http://localhost:3000",\n  debug: true,\n  timeout: 5000,\n}',
            },
            right: {
              label: 'Updated',
              content:
                'const config = {\n  apiUrl: "https://api.example.com",\n  debug: false,\n  timeout: 10000,\n  retries: 3,\n}',
            },
            mode: 'inline',
            showLineNumbers: true,
            highlightDiffs: true,
          }}
        />
      </MockProviders>
    </ShowcaseScreen>
  )
}

const styles = StyleSheet.create({
  imageContainer: { backgroundColor: '#f4f4f5', borderRadius: 12, overflow: 'hidden' },
})
