import { Page, Layout, Card, Text, BlockStack, Select, TextField, Button, InlineStack } from '@shopify/polaris';
import { useState } from 'react';
import VoiceWidget from '@/components/voice/VoiceWidget';

export default function WidgetDemo() {
  const [position, setPosition] = useState<'bottom-left' | 'bottom-right'>('bottom-right');
  const [primaryColor, setPrimaryColor] = useState('#008060');
  const [greetingMessage, setGreetingMessage] = useState("Hi! I'm your AI shopping assistant. How can I help you today?");
  const [showWidget, setShowWidget] = useState(true);

  const positionOptions = [
    { label: 'Bottom Right', value: 'bottom-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
  ];

  const colorPresets = [
    { label: 'Shopify Green', value: '#008060' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Purple', value: '#9333ea' },
    { label: 'Red', value: '#dc2626' },
    { label: 'Orange', value: '#ea580c' },
  ];

  const handleApplyChanges = () => {
    // Remount widget with new props
    setShowWidget(false);
    setTimeout(() => setShowWidget(true), 100);
  };

  return (
    <Page
      title="Voice Widget Demo"
      subtitle="Test and customize your voice AI widget"
    >
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Widget Customization
              </Text>

              <Select
                label="Position"
                options={positionOptions}
                value={position}
                onChange={(value) => setPosition(value as 'bottom-left' | 'bottom-right')}
              />

              <Select
                label="Primary Color"
                options={colorPresets}
                value={primaryColor}
                onChange={setPrimaryColor}
              />

              <TextField
                label="Custom Color (Hex)"
                value={primaryColor}
                onChange={setPrimaryColor}
                autoComplete="off"
                prefix="#"
              />

              <TextField
                label="Greeting Message"
                value={greetingMessage}
                onChange={setGreetingMessage}
                multiline={2}
                autoComplete="off"
              />

              <Button variant="primary" onClick={handleApplyChanges}>
                Apply Changes
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Widget Preview
              </Text>

              <Text as="p" variant="bodyMd" tone="subdued">
                Click the voice button in the {position === 'bottom-right' ? 'bottom-right' : 'bottom-left'} corner to test the widget.
              </Text>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Features:
                </Text>
                <InlineStack gap="200">
                  <Text as="p" variant="bodySm">✓ Voice input (microphone)</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="p" variant="bodySm">✓ Text input (typing)</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="p" variant="bodySm">✓ Real-time transcription</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="p" variant="bodySm">✓ AI voice responses</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="p" variant="bodySm">✓ Conversation history</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                How It Works
              </Text>
              
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  <strong>1. Click the voice button</strong> to start a conversation
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>2. Speak or type</strong> your question
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>3. AI responds</strong> with helpful information
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>4. Continue the conversation</strong> naturally
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Installation Instructions
              </Text>

              <Text as="p" variant="bodyMd">
                To add this widget to your Shopify store:
              </Text>

              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  1. Install the app from the Shopify App Store
                </Text>
                <Text as="p" variant="bodyMd">
                  2. Configure your AI agent in the AI Setup page
                </Text>
                <Text as="p" variant="bodyMd">
                  3. Customize the widget appearance here
                </Text>
                <Text as="p" variant="bodyMd">
                  4. The widget will automatically appear on your store
                </Text>
              </BlockStack>

              <Text as="p" variant="bodySm" tone="subdued">
                Note: Make sure to complete the Store Integration to connect your product catalog and order data.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Render the actual widget for testing */}
      {showWidget && (
        <VoiceWidget
          position={position}
          primaryColor={primaryColor}
          greetingMessage={greetingMessage}
          shopId="demo-store.myshopify.com"
        />
      )}

      <div style={{ height: '40px' }} />
    </Page>
  );
}
