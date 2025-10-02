import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';
import VoiceWidget from '../components/voice/VoiceWidget';

export default function WidgetDemo() {
  return (
    <>
      <Page
        title="Voice Widget Preview"
        subtitle="See how the voice widget appears to your customers"
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Customer-Facing Widget
                </Text>
                <Text as="p" variant="bodyMd">
                  The voice widget will appear as a floating button on your store pages. Click it to test the voice AI experience.
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  💡 In production, this connects to your existing Deno voice-websocket backend via WebRTC
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Customization Options
                </Text>
                <Text as="p" variant="bodyMd">
                  • Position: Bottom-left or bottom-right
                </Text>
                <Text as="p" variant="bodyMd">
                  • Primary color: Match your brand
                </Text>
                <Text as="p" variant="bodyMd">
                  • Greeting message: Customize first message
                </Text>
                <Text as="p" variant="bodyMd">
                  • Button text: Optional label
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>

      {/* Voice Widget Demo */}
      <VoiceWidget 
        position="bottom-right"
        primaryColor="#008060"
        greetingMessage="Hi! I'm your AI shopping assistant. How can I help you today?"
      />
    </>
  );
}
