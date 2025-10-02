import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';

export default function Analytics() {
  return (
    <Page
      title="Analytics"
      subtitle="Track voice AI performance and ROI"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Performance Metrics
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Analytics dashboard coming soon. Track:
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm">• Total conversations over time</Text>
                <Text as="p" variant="bodySm">• Average sentiment scores</Text>
                <Text as="p" variant="bodySm">• Resolution rates</Text>
                <Text as="p" variant="bodySm">• Sales impact attribution</Text>
                <Text as="p" variant="bodySm">• Most common customer questions</Text>
                <Text as="p" variant="bodySm">• Peak usage times</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                E-commerce Impact
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Coming soon: Track how voice AI affects your store's performance
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
