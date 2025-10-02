import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, Button } from '@shopify/polaris';

export default function StoreIntegration() {
  return (
    <Page
      title="Store Integration"
      subtitle="Connect your Shopify store data with the AI agent"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Product Integration
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success">✓ Connected</Badge>
                <Text as="p" variant="bodyMd">Syncing 247 products</Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Your AI can search products, check inventory, and make recommendations
              </Text>
              <Button>Refresh Product Data</Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Order Integration
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success">✓ Connected</Badge>
                <Text as="p" variant="bodyMd">Tracking active orders</Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                AI can lookup order status, tracking info, and handle order inquiries
              </Text>
              <Button>Configure Order Settings</Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Customer Data
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="attention">⚠ Partial</Badge>
                <Text as="p" variant="bodyMd">Limited access</Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Enable full customer data access for personalized experiences
              </Text>
              <Button variant="primary">Enable Customer Sync</Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Store Policies
              </Text>
              <Text as="p" variant="bodyMd">
                Upload your store's policies so the AI can answer customer questions accurately:
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm">• Shipping & Delivery Policy</Text>
                <Text as="p" variant="bodySm">• Returns & Refunds Policy</Text>
                <Text as="p" variant="bodySm">• Privacy Policy</Text>
                <Text as="p" variant="bodySm">• Terms of Service</Text>
              </BlockStack>
              <Button>Upload Policies</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
