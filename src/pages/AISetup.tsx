import { Page, Layout, Card, FormLayout, TextField, Select, Button, BlockStack, Text, InlineStack, Badge, Spinner } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { toast } from 'sonner';

export default function AISetup() {
  const { config, loading, updateConfig } = useAgentConfig();
  const { config: widgetConfig, loading: widgetLoading, updateConfig: updateWidgetConfig } = useWidgetConfig();
  
  const [voiceModel, setVoiceModel] = useState('alloy');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greeting, setGreeting] = useState('');
  const [maxDuration, setMaxDuration] = useState('5');
  
  // Widget config state
  const [position, setPosition] = useState<'bottom-left' | 'bottom-right'>('bottom-right');
  const [primaryColor, setPrimaryColor] = useState('#008060');
  const [buttonText, setButtonText] = useState('Chat with AI');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setGreeting(config.greeting_message);
      setSystemPrompt(config.system_prompt);
      setVoiceModel(config.voice_model);
      setMaxDuration(String(config.max_duration_minutes));
    }
  }, [config, loading]);

  useEffect(() => {
    if (!widgetLoading) {
      setPosition(widgetConfig.position);
      setPrimaryColor(widgetConfig.primary_color);
      setButtonText(widgetConfig.button_text);
    }
  }, [widgetConfig, widgetLoading]);

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
    
    // Save both agent and widget config
    const agentResult = await updateConfig({
      greeting_message: greeting,
      system_prompt: systemPrompt,
      voice_model: voiceModel,
      max_duration_minutes: parseInt(maxDuration) || 5,
    });
    
    const widgetResult = await updateWidgetConfig({
      position,
      primary_color: primaryColor,
      button_text: buttonText,
    });
    
    setSaving(false);
    if (agentResult.success && widgetResult.success) {
      toast.success('Configuration saved successfully!');
    } else {
      toast.error('Failed to save configuration. Please try again.');
    }
  };

  const colorPresets = [
    { label: 'Shopify Green', value: '#008060' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Purple', value: '#9333ea' },
    { label: 'Red', value: '#dc2626' },
    { label: 'Orange', value: '#ea580c' },
  ];

  if (loading || widgetLoading) {
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
              <Text as="h2" variant="headingLg">
                Widget Appearance
              </Text>
              <FormLayout>
                <Select
                  label="Widget Position"
                  options={[
                    { label: 'Bottom Right', value: 'bottom-right' },
                    { label: 'Bottom Left', value: 'bottom-left' },
                  ]}
                  value={position}
                  onChange={(value) => setPosition(value as 'bottom-left' | 'bottom-right')}
                  helpText="Where the voice widget button appears on your store"
                />

                <Select
                  label="Primary Color Preset"
                  options={colorPresets}
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  helpText="Choose a preset color or enter a custom hex code below"
                />

                <TextField
                  label="Custom Color (Hex)"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  autoComplete="off"
                  prefix="#"
                  helpText="Widget button and accent color"
                />

                <TextField
                  label="Button Text (Optional)"
                  value={buttonText}
                  onChange={setButtonText}
                  autoComplete="off"
                  helpText="Text shown on hover (leave empty for icon only)"
                />
              </FormLayout>

              <InlineStack gap="200">
                <div 
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 20 20" fill="white">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                </div>
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">Widget Preview</Text>
                  <Text as="p" variant="bodySm" tone="subdued">This is how your button will look</Text>
                </div>
              </InlineStack>
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
