import { Page, Layout, Card, FormLayout, TextField, Button, BlockStack, Text, InlineStack } from '@shopify/polaris';
import { useState } from 'react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  const handleSave = () => {
    console.log('Saving settings');
    // In production: Save to secure storage
  };

  return (
    <Page
      title="Settings"
      subtitle="Configure your Shopify Voice AI integration"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Shopify Integration
              </Text>
              <FormLayout>
                <TextField
                  label="Store Domain"
                  value=""
                  onChange={() => {}}
                  placeholder="your-store.myshopify.com"
                  autoComplete="off"
                  helpText="Your Shopify store domain"
                />
                
                <TextField
                  label="API Key"
                  type="password"
                  value={apiKey}
                  onChange={setApiKey}
                  placeholder="Enter your Shopify API key"
                  autoComplete="off"
                  helpText="Used to access your store's products and orders"
                />

                <TextField
                  label="Webhook URL"
                  value={webhookUrl}
                  onChange={setWebhookUrl}
                  placeholder="https://your-function.supabase.co/webhook"
                  autoComplete="off"
                  helpText="Receive real-time updates from Shopify"
                />
              </FormLayout>

              <InlineStack gap="300">
                <Button variant="primary" onClick={handleSave}>
                  Save Settings
                </Button>
                <Button>Test Connection</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Database Configuration
              </Text>
              <FormLayout>
                <TextField
                  label="Supabase Project URL"
                  value={supabaseUrl}
                  onChange={setSupabaseUrl}
                  placeholder="https://your-project.supabase.co"
                  autoComplete="off"
                />

                <TextField
                  label="Supabase API Key"
                  type="password"
                  value={supabaseKey}
                  onChange={setSupabaseKey}
                  placeholder="Enter your Supabase anon key"
                  autoComplete="off"
                  helpText="Your existing Supabase project key from sonic-prism-core"
                />
              </FormLayout>

              <Button variant="primary" onClick={handleSave}>
                Update Database Config
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Voice Widget Settings
              </Text>
              <FormLayout>
                <TextField
                  label="Widget Position"
                  value="bottom-right"
                  onChange={() => {}}
                  autoComplete="off"
                  helpText="Where the voice button appears on your store"
                />

                <TextField
                  label="Primary Color"
                  value="#008060"
                  onChange={() => {}}
                  autoComplete="off"
                  helpText="Customize the widget's appearance (hex color code)"
                />

                <TextField
                  label="Button Text"
                  value="Need help? Ask me!"
                  onChange={() => {}}
                  autoComplete="off"
                  helpText="Text shown on the voice widget button"
                />
              </FormLayout>

              <Button variant="primary">
                Preview Widget
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Billing & Usage
              </Text>
              <Text as="p" variant="bodyMd">
                Current Plan: <strong>Pro</strong>
              </Text>
              <Text as="p" variant="bodyMd">
                Usage this month: <strong>247 calls</strong> (out of 1,000 included)
              </Text>
              <Button>Manage Billing</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
