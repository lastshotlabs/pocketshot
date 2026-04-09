import { View, StyleSheet } from 'react-native'
import {
  Heading,
  Body,
  Label,
  Link,
  Image,
  Stack,
  Divider,
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
      </MockProviders>
    </ShowcaseScreen>
  )
}

const styles = StyleSheet.create({
  imageContainer: { backgroundColor: '#f4f4f5', borderRadius: 12, overflow: 'hidden' },
})
