import { Page, Layout, Card, FormLayout, TextField, Select, Button, BlockStack, Text, InlineStack, Badge, Spinner } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { toast } from 'sonner';

export default function AISetup() {
  const { config, loading, updateConfig } = useAgentConfig();
  
  const [voiceModel, setVoiceModel] = useState('alloy');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greeting, setGreeting] = useState('');
  const [maxDuration, setMaxDuration] = useState('5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setGreeting(config.greeting_message);
      setSystemPrompt(config.system_prompt);
      setVoiceModel(config.voice_model);
      setMaxDuration(String(config.max_duration_minutes));
    }
  }, [config, loading]);

  const voiceOptions = [
    { label: 'Alloy (Neutral)', value: 'alloy' },
    { label: 'Echo (Male)', value: 'echo' },
    { label: 'Fable (British Male)', value: 'fable' },
    { label: 'Onyx (Deep Male)', value: 'onyx' },
    { label: 'Nova (Female)', value: 'nova' },
    { label: 'Shimmer (Soft Female)', value: 'shimmer' },
  ];

  const handleSave = async () => {
    setSaving(true);
    const result = await updateConfig({
      greeting_message: greeting,
      system_prompt: systemPrompt,
      voice_model: voiceModel,
      max_duration_minutes: parseInt(maxDuration) || 5,
    });
    
    setSaving(false);
    if (result.success) {
      toast.success('AI configuration saved successfully!');
    } else {
      toast.error('Failed to save configuration. Please try again.');
    }
  };

  if (loading) {
    return (
      <Page title="AI Agent Setup">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner size="large" />
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="AI Agent Setup"
      subtitle="Configure your voice AI assistant's behavior and personality"
      primaryAction={{
        content: 'Save Configuration',
        onAction: handleSave,
        loading: saving,
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
