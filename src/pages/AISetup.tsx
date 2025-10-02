import { Page, Layout, Card, FormLayout, TextField, Select, Button, BlockStack, Text, InlineStack, Badge } from '@shopify/polaris';
import { useState } from 'react';

export default function AISetup() {
  const [voiceModel, setVoiceModel] = useState('alloy');
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant for an e-commerce store. Help customers find products, check order status, and answer questions about shipping and returns. Be friendly, concise, and professional."
  );
  const [greeting, setGreeting] = useState("Hi! I'm your AI shopping assistant. How can I help you today?");
  const [maxDuration, setMaxDuration] = useState('5');

  const voiceOptions = [
    { label: 'Alloy (Neutral)', value: 'alloy' },
    { label: 'Echo (Male)', value: 'echo' },
    { label: 'Fable (British Male)', value: 'fable' },
    { label: 'Onyx (Deep Male)', value: 'onyx' },
    { label: 'Nova (Female)', value: 'nova' },
    { label: 'Shimmer (Soft Female)', value: 'shimmer' },
  ];

  const handleSave = () => {
    console.log('Saving AI configuration:', {
      voiceModel,
      systemPrompt,
      greeting,
      maxDuration,
    });
    // In production: Save to Supabase via edge function
  };

  return (
    <Page
      title="AI Agent Setup"
      subtitle="Configure your voice AI assistant's behavior and personality"
      primaryAction={{
        content: 'Save Configuration',
        onAction: handleSave,
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Voice Settings
              </Text>
              <FormLayout>
                <Select
                  label="Voice Model"
                  options={voiceOptions}
                  value={voiceModel}
                  onChange={setVoiceModel}
                  helpText="Choose the voice personality for your AI agent"
                />
                
                <TextField
                  label="Greeting Message"
                  value={greeting}
                  onChange={setGreeting}
                  multiline={2}
                  autoComplete="off"
                  helpText="First message customers hear when they start a conversation"
                />

                <TextField
                  label="Max Call Duration (minutes)"
                  type="number"
                  value={maxDuration}
                  onChange={setMaxDuration}
                  autoComplete="off"
                  helpText="Maximum length for a single conversation"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingLg">
                  System Prompt
                </Text>
                <Badge tone="info">Advanced</Badge>
              </InlineStack>
              
              <TextField
                label="AI Behavior Instructions"
                value={systemPrompt}
                onChange={setSystemPrompt}
                multiline={8}
                autoComplete="off"
                helpText="Define how your AI agent should behave, what it should know, and how it should respond to customers"
              />

              <Text as="p" variant="bodySm" tone="subdued">
                💡 Tip: Be specific about your store's policies, tone of voice, and common customer questions. The AI will use this as its core instructions.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Capabilities
              </Text>

              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="success">✓ Active</Badge>
                  <Text as="p" variant="bodyMd">Product Search & Recommendations</Text>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="success">✓ Active</Badge>
                  <Text as="p" variant="bodyMd">Order Status Lookup</Text>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="success">✓ Active</Badge>
                  <Text as="p" variant="bodyMd">Shipping & Returns Policy</Text>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="attention">⚠ Requires Setup</Badge>
                  <Text as="p" variant="bodyMd">Inventory Checking</Text>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="attention">⚠ Requires Setup</Badge>
                  <Text as="p" variant="bodyMd">Appointment Booking</Text>
                </InlineStack>
              </BlockStack>

              <Button url="/store-integration">
                Configure Store Integration
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Test Your AI Agent
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Try out your AI agent with a test conversation before deploying to customers
              </Text>
              <Button variant="primary">
                Start Test Conversation
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
