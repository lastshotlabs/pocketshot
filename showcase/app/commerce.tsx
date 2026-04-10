import {
  PriceDisplay,
  ProductCard,
  CartItem,
  PricingTable,
  Stack,
  Row,
  Heading,
  Divider,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function CommerceShowcase() {
  return (
    <ShowcaseScreen title="Commerce">
      <MockProviders>
        <SectionLabel label="PriceDisplay — sizes" />
        <Stack config={{ gap: 8 }}>
          <PriceDisplay config={{ amount: 9.99, currency: 'USD', size: 'sm' }} />
          <PriceDisplay config={{ amount: 29.99, currency: 'USD', size: 'md' }} />
          <PriceDisplay config={{ amount: 149.0, currency: 'USD', size: 'lg' }} />
          <PriceDisplay config={{ amount: 999.0, currency: 'USD', size: 'xl' }} />
        </Stack>

        <SectionLabel label="PriceDisplay — with original (sale)" />
        <Stack config={{ gap: 8 }}>
          <PriceDisplay
            config={{
              amount: 79.99,
              originalAmount: 129.99,
              currency: 'USD',
              size: 'lg',
              badge: 'SALE',
            }}
          />
          <PriceDisplay
            config={{
              amount: 14.99,
              originalAmount: 24.99,
              currency: 'USD',
              size: 'md',
              badge: '40% OFF',
            }}
          />
        </Stack>

        <SectionLabel label="PriceDisplay — currencies" />
        <Row config={{ gap: 16, wrap: true }}>
          <PriceDisplay config={{ amount: 29.99, currency: 'USD', locale: 'en-US', size: 'md' }} />
          <PriceDisplay config={{ amount: 27.50, currency: 'EUR', locale: 'de-DE', size: 'md' }} />
          <PriceDisplay config={{ amount: 4200, currency: 'JPY', locale: 'ja-JP', size: 'md' }} />
          <PriceDisplay config={{ amount: 24.99, currency: 'GBP', locale: 'en-GB', size: 'md' }} />
        </Row>

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="ProductCard — full featured" />
        <ProductCard
          config={{
            title: 'Mechanical Keyboard Pro',
            description: 'TKL layout, Cherry MX Blue switches, aluminum frame with RGB backlighting.',
            image: 'https://picsum.photos/seed/keyboard/600/400',
            price: 149.99,
            currency: 'USD',
            badge: 'Best Seller',
            rating: 4.7,
            reviewCount: 1284,
            onPress: { type: 'toast', message: 'Product tapped' },
            onAddToCart: { type: 'toast', message: 'Added to cart!' },
          }}
        />

        <ProductCard
          config={{
            title: 'Wireless Mouse',
            description: 'Ultra-light 62g, 70-hour battery, tri-mode connectivity.',
            image: 'https://picsum.photos/seed/mouse/600/400',
            price: 79.99,
            currency: 'USD',
            badge: 'New',
            rating: 4.5,
            reviewCount: 342,
            onPress: { type: 'toast', message: 'Product tapped' },
            onAddToCart: { type: 'toast', message: 'Added to cart!' },
          }}
        />

        <SectionLabel label="ProductCard — no image, no rating" />
        <ProductCard
          config={{
            title: 'USB-C Hub 7-in-1',
            description: 'HDMI 4K, 3x USB-A, SD card reader, 100W PD charging.',
            price: 49.99,
            currency: 'USD',
            onPress: { type: 'toast', message: 'Product tapped' },
            onAddToCart: { type: 'toast', message: 'Added to cart!' },
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="CartItem" />
        <Stack config={{ gap: 8 }}>
          <CartItem
            config={{
              title: 'Mechanical Keyboard Pro',
              variant: 'Black / Cherry MX Blue',
              price: 149.99,
              quantity: 1,
              currency: 'USD',
              image: 'https://picsum.photos/seed/keyboard/200/200',
              onQuantityChange: { type: 'toast', message: 'Quantity changed' },
              onRemove: { type: 'toast', message: 'Item removed' },
            }}
          />
          <CartItem
            config={{
              title: 'Wireless Mouse',
              variant: 'White',
              price: 79.99,
              quantity: 2,
              currency: 'USD',
              image: 'https://picsum.photos/seed/mouse/200/200',
              onQuantityChange: { type: 'toast', message: 'Quantity changed' },
              onRemove: { type: 'toast', message: 'Item removed' },
            }}
          />
          <CartItem
            config={{
              title: 'USB-C Hub 7-in-1',
              price: 49.99,
              quantity: 1,
              currency: 'USD',
              onQuantityChange: { type: 'toast', message: 'Quantity changed' },
              onRemove: { type: 'toast', message: 'Item removed' },
            }}
          />
        </Stack>

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="Order total" />
        <Stack config={{ gap: 4, padding: 16, backgroundColor: '#f9f9f9' }}>
          <Row config={{ justify: 'space-between', align: 'center' }}>
            <Heading config={{ text: 'Subtotal', level: 5 }} />
            <PriceDisplay config={{ amount: 359.97, currency: 'USD', size: 'md' }} />
          </Row>
          <Row config={{ justify: 'space-between', align: 'center' }}>
            <Heading config={{ text: 'Shipping', level: 5 }} />
            <PriceDisplay config={{ amount: 0, currency: 'USD', size: 'md' }} />
          </Row>
          <Divider config={{ marginVertical: 4 }} />
          <Row config={{ justify: 'space-between', align: 'center' }}>
            <Heading config={{ text: 'Total', level: 4 }} />
            <PriceDisplay config={{ amount: 359.97, currency: 'USD', size: 'xl' }} />
          </Row>
        </Stack>
        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="PricingTable — 3-tier plans" />
        <PricingTable
          config={{
            title: 'Choose Your Plan',
            subtitle: 'Start free, upgrade when you need more.',
            tiers: [
              {
                id: 'free',
                name: 'Free',
                price: '$0',
                period: '/mo',
                description: 'For individuals getting started',
                features: [
                  '1 project',
                  '500 MB storage',
                  'Community support',
                  'Basic analytics',
                  'Email notifications',
                ],
                cta: {
                  label: 'Get Started',
                  onPress: { type: 'toast', message: 'Selected Free plan' },
                },
              },
              {
                id: 'pro',
                name: 'Pro',
                price: '$29',
                period: '/mo',
                description: 'For growing teams',
                features: [
                  'Unlimited projects',
                  '50 GB storage',
                  'Priority support',
                  'Advanced analytics',
                  'Custom domains',
                  'Team collaboration',
                  'API access',
                  'Webhooks',
                ],
                cta: {
                  label: 'Start Free Trial',
                  onPress: { type: 'toast', message: 'Selected Pro plan' },
                },
                highlighted: true,
              },
              {
                id: 'enterprise',
                name: 'Enterprise',
                price: '$99',
                period: '/mo',
                description: 'For large organizations',
                features: [
                  'Everything in Pro',
                  '500 GB storage',
                  'Dedicated support',
                  'SSO / SAML',
                  'Audit logs',
                  'Custom contracts',
                  'SLA guarantee',
                  'On-premise option',
                  'Role-based access',
                  'Data residency',
                ],
                cta: {
                  label: 'Contact Sales',
                  onPress: { type: 'toast', message: 'Selected Enterprise plan' },
                },
              },
            ],
            highlightedLabel: 'Most Popular',
            testID: 'pricing-table',
          }}
        />
      </MockProviders>
    </ShowcaseScreen>
  )
}
