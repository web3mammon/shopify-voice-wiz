import { Page, Layout, Card, DataTable, Badge, Button, InlineStack, Text, BlockStack } from '@shopify/polaris';
import { useState } from 'react';

interface Conversation {
  id: string;
  customer: string;
  date: string;
  duration: string;
  sentiment: string;
  topic: string;
  resolved: boolean;
}

export default function Conversations() {
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      customer: 'Customer #4532',
      date: '2025-10-02 14:23',
      duration: '2:34',
      sentiment: 'positive',
      topic: 'Product inquiry',
      resolved: true,
    },
    {
      id: '2',
      customer: 'Customer #4521',
      date: '2025-10-02 14:10',
      duration: '1:45',
      sentiment: 'neutral',
      topic: 'Order status',
      resolved: true,
    },
    {
      id: '3',
      customer: 'Customer #4498',
      date: '2025-10-02 13:55',
      duration: '4:12',
      sentiment: 'negative',
      topic: 'Refund request',
      resolved: false,
    },
    {
      id: '4',
      customer: 'Customer #4487',
      date: '2025-10-02 13:42',
      duration: '3:05',
      sentiment: 'positive',
      topic: 'Shipping question',
      resolved: true,
    },
    {
      id: '5',
      customer: 'Customer #4476',
      date: '2025-10-02 13:30',
      duration: '2:18',
      sentiment: 'positive',
      topic: 'Product recommendation',
      resolved: true,
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const getSentimentBadge = (sentiment: string) => {
    const tones: Record<string, 'success' | 'info' | 'critical'> = {
      positive: 'success',
      neutral: 'info',
      negative: 'critical',
    };
    return <Badge tone={tones[sentiment] || 'info'}>{sentiment}</Badge>;
  };

  const rows = conversations.map((conv) => [
    conv.customer,
    conv.date,
    conv.duration,
    getSentimentBadge(conv.sentiment),
    conv.topic,
    <Badge tone={conv.resolved ? 'success' : 'warning'}>
      {conv.resolved ? 'Resolved' : 'Pending'}
    </Badge>,
    <Button size="slim" onClick={() => setSelectedConversation(conv.id)}>
      View Details
    </Button>,
  ]);

  return (
    <Page
      title="Conversations"
      subtitle="View and analyze all customer voice interactions"
      primaryAction={{
        content: 'Export Data',
        onAction: () => console.log('Export conversations'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={[
                'text',
                'text',
                'text',
                'text',
                'text',
                'text',
                'text',
              ]}
              headings={[
                'Customer',
                'Date & Time',
                'Duration',
                'Sentiment',
                'Topic',
                'Status',
                'Actions',
              ]}
              rows={rows}
            />
          </Card>
        </Layout.Section>

        {selectedConversation && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    Conversation Details
                  </Text>
                  <Button onClick={() => setSelectedConversation(null)}>
                    Close
                  </Button>
                </InlineStack>

                <BlockStack gap="300">
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Transcript
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <strong>Customer:</strong> Hi, I'm interested in your wireless headphones. Do they come in black?
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <strong>AI Agent:</strong> Yes! Our wireless headphones are available in black, white, and navy blue. The black model is currently in stock with free shipping available.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <strong>Customer:</strong> Perfect! What's the battery life?
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <strong>AI Agent:</strong> They offer up to 30 hours of playtime on a single charge, and come with a quick-charge feature that gives you 5 hours of playback with just a 10-minute charge.
                      </Text>
                    </BlockStack>
                  </Card>

                  <Card background="bg-surface-secondary">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Sentiment Analysis
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Overall Sentiment: <Badge tone="success">Positive</Badge>
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        The customer showed high interest and engagement throughout the conversation. No negative indicators detected.
                      </Text>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
