import { View, Text, StyleSheet } from 'react-native'
import { Stack, Row, Card, Divider, Spacer, Section } from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function LayoutShowcase() {
  return (
    <ShowcaseScreen title="Layout">
      <MockProviders>
        <SectionLabel label="Stack — vertical layout" />
        <Stack config={{ gap: 8, padding: 12, bg: '#f4f4f5' }}>
          <View style={styles.block} />
          <View style={styles.block} />
          <View style={styles.block} />
        </Stack>

        <SectionLabel label="Stack — centered" />
        <Stack config={{ gap: 8, alignItems: 'center', padding: 12, bg: '#f4f4f5' }}>
          <View style={[styles.block, { width: 80 }]} />
          <View style={[styles.block, { width: 120 }]} />
          <View style={[styles.block, { width: 60 }]} />
        </Stack>

        <SectionLabel label="Row — space-between" />
        <Row config={{ justifyContent: 'between', padding: 12, bg: '#f4f4f5' }}>
          <View style={[styles.block, { width: 60 }]} />
          <View style={[styles.block, { width: 60 }]} />
          <View style={[styles.block, { width: 60 }]} />
        </Row>

        <SectionLabel label="Row — gap + wrap" />
        <Row config={{ gap: 8, flexWrap: 'wrap', padding: 12, bg: '#f4f4f5' }}>
          {[80, 100, 60, 120, 90].map((w, i) => (
            <View key={i} style={[styles.block, { width: w }]} />
          ))}
        </Row>

        <SectionLabel label="Card — shadow variants" />
        <Stack config={{ gap: 8 }}>
          <Card config={{ shadow: 'sm', padding: 12 }}>
            <Text style={styles.cardText}>Shadow: sm</Text>
          </Card>
          <Card config={{ shadow: 'md', padding: 12 }}>
            <Text style={styles.cardText}>Shadow: md</Text>
          </Card>
          <Card config={{ shadow: 'lg', padding: 12 }}>
            <Text style={styles.cardText}>Shadow: lg</Text>
          </Card>
        </Stack>

        <SectionLabel label="Card — radius variants" />
        <Stack config={{ gap: 8 }}>
          <Card config={{ borderRadius: 'none', padding: 12, bg: '#ede9fe' }}>
            <Text style={styles.cardText}>Radius: none</Text>
          </Card>
          <Card config={{ borderRadius: 'md', padding: 12, bg: '#ede9fe' }}>
            <Text style={styles.cardText}>Radius: md</Text>
          </Card>
          <Card config={{ borderRadius: '2xl', padding: 12, bg: '#ede9fe' }}>
            <Text style={styles.cardText}>Radius: 2xl</Text>
          </Card>
        </Stack>

        <SectionLabel label="Divider" />
        <Divider config={{ thickness: 1 }} />
        <Divider config={{ thickness: 2, color: '#7c3aed', marginY: 4 }} />
        <Divider config={{ thickness: 4, color: '#e4e4e7', marginY: 8 }} />

        <SectionLabel label="Spacer" />
        <View style={styles.spacerDemo}>
          <View style={styles.spacerBox} />
          <Spacer config={{ size: 24 }} />
          <View style={styles.spacerBox} />
          <Spacer config={{ size: 48 }} />
          <View style={styles.spacerBox} />
        </View>

        <SectionLabel label="Section — with title + description" />
        <Section
          config={{
            title: 'Account Settings',
            description: 'Manage your profile and preferences',
            padding: 0,
          }}
        >
          <View style={styles.sectionContent}>
            <Text style={styles.cardText}>Section children go here</Text>
          </View>
        </Section>

        <Section config={{ title: 'Notifications', titleSize: 'lg', padding: 0 }}>
          <View style={styles.sectionContent}>
            <Text style={styles.cardText}>Large title section</Text>
          </View>
        </Section>
      </MockProviders>
    </ShowcaseScreen>
  )
}

const styles = StyleSheet.create({
  block: { height: 36, backgroundColor: '#a78bfa', borderRadius: 6 },
  cardText: { fontSize: 14, color: '#18181b' },
  spacerDemo: { flexDirection: 'column', alignItems: 'center' },
  spacerBox: { width: 40, height: 16, backgroundColor: '#d4d4d8', borderRadius: 4 },
  sectionContent: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
})
