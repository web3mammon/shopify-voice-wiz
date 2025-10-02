import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, TextField, Select, Button, Spinner, ButtonGroup, Pagination } from '@shopify/polaris';
import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useToast } from '@/hooks/use-toast';

export default function Conversations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const pageSize = 10;
  const { conversations, loading, totalCount } = useConversations(searchQuery, sentimentFilter, currentPage, pageSize);
  
  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSentimentChange = (value: string) => {
    setSentimentFilter(value);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Customer', 'Topic', 'Sentiment', 'Duration (s)', 'Date'];
    const rows = conversations.map(c => [
      c.customer_identifier,
      c.topic,
      c.sentiment,
      c.duration_seconds.toString(),
      new Date(c.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export complete',
      description: `Exported ${conversations.length} conversations to CSV`,
    });
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(conversations, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export complete',
      description: `Exported ${conversations.length} conversations to JSON`,
    });
  };

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
              <InlineStack gap="400" wrap={false} blockAlign="end">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Search conversations"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by customer or topic..."
                    autoComplete="off"
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <Select
                    label="Filter by sentiment"
                    options={sentimentFilterOptions}
                    value={sentimentFilter}
                    onChange={handleSentimentChange}
                  />
                </div>
                <ButtonGroup>
                  <Button onClick={exportToCSV} disabled={conversations.length === 0}>
                    Export CSV
                  </Button>
                  <Button onClick={exportToJSON} disabled={conversations.length === 0}>
                    Export JSON
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Conversations List */}
        <Layout.Section>
          <BlockStack gap="400">
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

            {/* Pagination */}
            {!loading && conversations.length > 0 && totalPages > 1 && (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                  <Pagination
                    hasPrevious={currentPage > 1}
                    onPrevious={() => setCurrentPage(currentPage - 1)}
                    hasNext={currentPage < totalPages}
                    onNext={() => setCurrentPage(currentPage + 1)}
                    label={`Page ${currentPage} of ${totalPages}`}
                  />
                </div>
              </Card>
            )}
          </BlockStack>
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
                  <Text as="p" variant="headingMd">{totalCount}</Text>
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
