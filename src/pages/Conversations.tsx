import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, TextField, Select, Button, Spinner } from '@shopify/polaris';
import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';

export default function Conversations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { conversations, loading } = useConversations(searchQuery, sentimentFilter);

  const sentimentFilterOptions = [
    { label: 'All Sentiments', value: 'all' },
    { label: 'Positive', value: 'positive' },
    { label: 'Neutral', value: 'neutral' },
    { label: 'Negative', value: 'negative' },
  ];

  const getSentimentBadge = (sentiment: string) => {
    const tones: Record<string, 'success' | 'info' | 'critical'> = {
      positive: 'success',
      neutral: 'info',
      negative: 'critical',
    };
    return <Badge tone={tones[sentiment] || 'info'}>{sentiment}</Badge>;
  };

  const selectedConvDetails = conversations.find(c => c.id === selectedConversation);

  return (
    <Page
      title="Voice Conversations"
      subtitle="View and manage all customer interactions"
    >
      <Layout>
        {/* Search and Filter */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" wrap={false}>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Search conversations"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by customer or topic..."
                    autoComplete="off"
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <Select
                    label="Filter by sentiment"
                    options={sentimentFilterOptions}
                    value={sentimentFilter}
                    onChange={setSentimentFilter}
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Conversations List */}
        <Layout.Section>
          {loading ? (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner size="large" />
              </div>
            </Card>
          ) : conversations.length === 0 ? (
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                  No conversations found
                </Text>
              </BlockStack>
            </Card>
          ) : (
            <BlockStack gap="300">
              {conversations.map((conversation) => (
                <Card key={conversation.id}>
                  <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="200">
                      <InlineStack gap="300" blockAlign="center">
                        <Text as="h3" variant="headingMd">
                          {conversation.customer_identifier}
                        </Text>
                        {getSentimentBadge(conversation.sentiment)}
                      </InlineStack>
                      
                      <InlineStack gap="400">
                        <Text as="p" variant="bodySm" tone="subdued">
                          Topic: {conversation.topic}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Duration: {conversation.formattedDuration}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {conversation.formattedTime}
                        </Text>
                      </InlineStack>
                    </BlockStack>
                    
                    <Button
                      onClick={() => setSelectedConversation(
                        selectedConversation === conversation.id ? null : conversation.id
                      )}
                    >
                      {selectedConversation === conversation.id ? 'Hide' : 'View'} Transcript
                    </Button>
                  </InlineStack>

                  {/* Expanded Transcript */}
                  {selectedConversation === conversation.id && selectedConvDetails && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e1e3e5' }}>
                      <BlockStack gap="300">
                        <Text as="h4" variant="headingSm">
                          Conversation Transcript
                        </Text>
                        {selectedConvDetails.transcript && 
                        Array.isArray(selectedConvDetails.transcript) && 
                        selectedConvDetails.transcript.length > 0 ? (
                          <BlockStack gap="200">
                            {selectedConvDetails.transcript.map((message: any, index: number) => (
                              <div
                                key={index}
                                style={{
                                  padding: '12px',
                                  backgroundColor: message.role === 'customer' ? '#f6f6f7' : '#e3f2fd',
                                  borderRadius: '8px',
                                }}
                              >
                                <Text as="p" variant="bodySm" fontWeight="semibold">
                                  {message.role === 'customer' ? 'Customer' : 'AI Assistant'}:
                                </Text>
                                <Text as="p" variant="bodyMd">
                                  {message.content}
                                </Text>
                                {message.timestamp && (
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </Text>
                                )}
                              </div>
                            ))}
                          </BlockStack>
                        ) : (
                          <Text as="p" variant="bodySm" tone="subdued">
                            No transcript available for this conversation.
                          </Text>
                        )}
                      </BlockStack>
                    </div>
                  )}
                </Card>
              ))}
            </BlockStack>
          )}
        </Layout.Section>

        {/* Summary Stats */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Summary
              </Text>
              <InlineStack gap="400" wrap={true}>
                <div>
                  <Text as="p" variant="headingMd">{conversations.length}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Total Conversations</Text>
                </div>
                <div>
                  <Text as="p" variant="headingMd">
                    {conversations.filter(c => c.sentiment === 'positive').length}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">Positive</Text>
                </div>
                <div>
                  <Text as="p" variant="headingMd">
                    {conversations.filter(c => c.sentiment === 'neutral').length}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">Neutral</Text>
                </div>
                <div>
                  <Text as="p" variant="headingMd">
                    {conversations.filter(c => c.sentiment === 'negative').length}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">Negative</Text>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      <div style={{ height: '40px' }} />
    </Page>
  );
}
