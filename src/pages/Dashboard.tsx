import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, Button, Banner, Select } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardStats {
  totalCalls: number;
  activeCalls: number;
  avgSentiment: number;
  resolvedIssues: number;
  salesImpact: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    activeCalls: 0,
    avgSentiment: 0,
    resolvedIssues: 0,
    salesImpact: '$0',
  });

  const [recentCalls, setRecentCalls] = useState([
    {
      id: '1',
      customer: 'Customer #4532',
      topic: 'Product inquiry',
      sentiment: 'positive',
      duration: '2:34',
      timestamp: '5 minutes ago',
    },
    {
      id: '2',
      customer: 'Customer #4521',
      topic: 'Order status',
      sentiment: 'neutral',
      duration: '1:45',
      timestamp: '12 minutes ago',
    },
    {
      id: '3',
      customer: 'Customer #4498',
      topic: 'Refund request',
      sentiment: 'negative',
      duration: '4:12',
      timestamp: '28 minutes ago',
    },
  ]);

  useEffect(() => {
    // Simulate loading stats - in production, fetch from Supabase
    const timer = setTimeout(() => {
      setStats({
        totalCalls: 247,
        activeCalls: 3,
        avgSentiment: 4.2,
        resolvedIssues: 189,
        salesImpact: '$12,450',
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getSentimentBadge = (sentiment: string) => {
    const tones: Record<string, 'success' | 'info' | 'critical'> = {
      positive: 'success',
      neutral: 'info',
      negative: 'critical',
    };
    return <Badge tone={tones[sentiment] || 'info'}>{sentiment}</Badge>;
  };

  const [agentStatus, setAgentStatus] = useState<'running' | 'paused'>('running');
  const [setupStatus, setSetupStatus] = useState<'complete' | 'warning' | 'critical'>('warning');
  const [dateFilter, setDateFilter] = useState('today');

  // Chart data - calls over time
  const [chartData, setChartData] = useState([
    { time: '00:00', calls: 12, sentiment: 4.2 },
    { time: '04:00', calls: 8, sentiment: 4.0 },
    { time: '08:00', calls: 35, sentiment: 4.3 },
    { time: '12:00', calls: 52, sentiment: 4.5 },
    { time: '16:00', calls: 68, sentiment: 4.4 },
    { time: '20:00', calls: 42, sentiment: 4.1 },
  ]);

  const handleToggleAgent = () => {
    setAgentStatus(prev => prev === 'running' ? 'paused' : 'running');
  };

  const dateFilterOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 3 Days', value: 'last3days' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'This Month', value: 'thismonth' },
    { label: 'Last Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'custom' },
  ];

  const getStatusBanner = () => {
    if (setupStatus === 'complete') {
      return {
        tone: 'success' as const,
        title: '✅ All Systems Ready',
        message: 'Your Voice AI agent is fully configured and ready to handle customer inquiries.'
      };
    } else if (setupStatus === 'warning') {
      return {
        tone: 'warning' as const,
        title: '⚠️ Configuration Incomplete',
        message: 'Some settings need attention. Please complete AI Agent Setup and Store Integration.'
      };
    } else {
      return {
        tone: 'critical' as const,
        title: '🚨 Critical Setup Required',
        message: 'Essential configuration missing. Your voice AI cannot function until setup is complete.'
      };
    }
  };

  const statusBanner = getStatusBanner();

  return (
    <Page
      title="Voice AI Dashboard"
      subtitle="Monitor your voice AI agent performance and customer interactions"
    >
      <Layout>
        {/* Setup Status Banner */}
        <Layout.Section>
          <Banner tone={statusBanner.tone} title={statusBanner.title}>
            <p>{statusBanner.message}</p>
          </Banner>
        </Layout.Section>

        {/* AI Agent Control */}
        <Layout.Section>
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">
                  Voice AI Agent Status
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {agentStatus === 'running' ? '🟢 Agent is active and handling calls' : '🔴 Agent is paused'}
                </Text>
              </BlockStack>
              <Button
                variant={agentStatus === 'running' ? 'primary' : 'secondary'}
                tone={agentStatus === 'running' ? 'critical' : 'success'}
                onClick={handleToggleAgent}
              >
                {agentStatus === 'running' ? 'Pause AI Agent' : 'Resume AI Agent'}
              </Button>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Stats Overview */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Total Calls Today
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {stats.totalCalls}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    +12% from yesterday
                  </Text>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Active Calls
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="p" variant="heading2xl">
                      {stats.activeCalls}
                    </Text>
                    <Badge tone="success">Live</Badge>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Real-time conversations
                  </Text>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Avg. Sentiment
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {stats.avgSentiment}/5.0
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Customer satisfaction
                  </Text>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Sales Impact
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {stats.salesImpact}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    AI-assisted revenue
                  </Text>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>

        {/* Analytics Chart */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingLg">
                  Call Volume & Sentiment
                </Text>
                <div style={{ width: '200px' }}>
                  <Select
                    label=""
                    options={dateFilterOptions}
                    value={dateFilter}
                    onChange={setDateFilter}
                  />
                </div>
              </InlineStack>
              
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#008060" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#008060" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="calls" 
                      stroke="#008060" 
                      fillOpacity={1} 
                      fill="url(#colorCalls)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Recent Conversations */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">
                  Recent Conversations
                </Text>
                <Button url="/conversations">View all</Button>
              </InlineStack>

              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <Card key={call.id}>
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h3" variant="headingMd">
                            {call.customer}
                          </Text>
                          {getSentimentBadge(call.sentiment)}
                        </InlineStack>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {call.topic} • {call.duration}
                        </Text>
                      </BlockStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {call.timestamp}
                      </Text>
                    </InlineStack>
                  </Card>
                ))}
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Quick Actions
              </Text>
              <InlineStack gap="300">
                <Button url="/ai-setup" variant="primary">
                  Configure AI Agent
                </Button>
                <Button url="/store-integration">
                  Setup Store Integration
                </Button>
                <Button url="/widget-demo">
                  Preview Voice Widget
                </Button>
                <Button url="/analytics">
                  View Analytics
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
