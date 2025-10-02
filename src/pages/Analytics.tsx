import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, Select } from '@shopify/polaris';
import { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function Analytics() {
  const [dateFilter, setDateFilter] = useState('last7days');

  const dateFilterOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 3 Days', value: 'last3days' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'This Month', value: 'thismonth' },
    { label: 'Last Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'custom' },
  ];

  // Call volume trend data
  const callVolumeData = [
    { date: 'Mon', calls: 45, resolved: 38, escalated: 7 },
    { date: 'Tue', calls: 52, resolved: 47, escalated: 5 },
    { date: 'Wed', calls: 61, resolved: 55, escalated: 6 },
    { date: 'Thu', calls: 48, resolved: 43, escalated: 5 },
    { date: 'Fri', calls: 68, resolved: 61, escalated: 7 },
    { date: 'Sat', calls: 72, resolved: 65, escalated: 7 },
    { date: 'Sun', calls: 58, resolved: 52, escalated: 6 },
  ];

  // Sentiment breakdown data
  const sentimentData = [
    { name: 'Positive', value: 68, color: '#50B83C' },
    { name: 'Neutral', value: 24, color: '#FFC453' },
    { name: 'Negative', value: 8, color: '#D82C0D' },
  ];

  // Top topics data
  const topicsData = [
    { topic: 'Product Info', count: 89 },
    { topic: 'Order Status', count: 76 },
    { topic: 'Shipping', count: 54 },
    { topic: 'Returns', count: 42 },
    { topic: 'Pricing', count: 38 },
    { topic: 'Availability', count: 28 },
  ];

  // Peak hours data
  const peakHoursData = [
    { hour: '12AM', calls: 8 },
    { hour: '4AM', calls: 3 },
    { hour: '8AM', calls: 24 },
    { hour: '12PM', calls: 45 },
    { hour: '4PM', calls: 52 },
    { hour: '8PM', calls: 38 },
  ];

  return (
    <Page
      title="Analytics"
      subtitle="Track voice AI performance and ROI"
    >
      <Layout>
        {/* Date Filter */}
        <Layout.Section>
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Date Range
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
          </Card>
        </Layout.Section>

        {/* Key Performance Metrics */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Total Calls
                  </Text>
                  <Text as="p" variant="heading2xl">
                    404
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    +18% vs previous period
                  </Text>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Resolution Rate
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="p" variant="heading2xl">
                      89%
                    </Text>
                    <Badge tone="success">High</Badge>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    AI handled without escalation
                  </Text>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Avg. Call Duration
                  </Text>
                  <Text as="p" variant="heading2xl">
                    2:34
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Minutes per conversation
                  </Text>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Customer Satisfaction
                  </Text>
                  <Text as="p" variant="heading2xl">
                    4.6/5.0
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Based on sentiment analysis
                  </Text>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>

        {/* Call Volume Trend */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Call Volume & Resolution Trend
              </Text>
              <div style={{ height: '350px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={callVolumeData}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#008060" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#008060" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#50B83C" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#50B83C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="calls" 
                      name="Total Calls"
                      stroke="#008060" 
                      fillOpacity={1} 
                      fill="url(#colorCalls)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="resolved" 
                      name="AI Resolved"
                      stroke="#50B83C" 
                      fillOpacity={1} 
                      fill="url(#colorResolved)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Sentiment & Topics Row */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false} blockAlign="stretch">
            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Sentiment Breakdown
                  </Text>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#50B83C', borderRadius: '2px' }} />
                      <Text as="p" variant="bodySm">Positive: 68%</Text>
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#FFC453', borderRadius: '2px' }} />
                      <Text as="p" variant="bodySm">Neutral: 24%</Text>
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#D82C0D', borderRadius: '2px' }} />
                      <Text as="p" variant="bodySm">Negative: 8%</Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Top Conversation Topics
                  </Text>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="topic" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#008060" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>

        {/* Peak Hours & Sales Impact */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false} blockAlign="stretch">
            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Peak Call Hours
                  </Text>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakHoursData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="calls" fill="#5C6AC4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Understanding peak hours helps optimize AI availability
                  </Text>
                </BlockStack>
              </Card>
            </div>

            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Sales Impact
                  </Text>
                  <BlockStack gap="300">
                    <div>
                      <Text as="p" variant="headingXl">
                        $18,450
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        AI-assisted revenue this period
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="headingLg">
                        156
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Orders influenced by voice AI
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="headingLg">
                        $118
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Average order value from AI conversations
                      </Text>
                    </div>
                    <div>
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="p" variant="headingLg">
                          32%
                        </Text>
                        <Badge tone="success">+12%</Badge>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Conversion rate from AI interactions
                      </Text>
                    </div>
                  </BlockStack>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>

        {/* Call Outcomes & ROI */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Call Outcomes & Performance
              </Text>
              <InlineStack gap="400" wrap={true}>
                <div style={{ minWidth: '200px' }}>
                  <BlockStack gap="100">
                    <Text as="p" variant="headingMd">360</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Resolved by AI</Text>
                  </BlockStack>
                </div>
                <div style={{ minWidth: '200px' }}>
                  <BlockStack gap="100">
                    <Text as="p" variant="headingMd">44</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Escalated to Human</Text>
                  </BlockStack>
                </div>
                <div style={{ minWidth: '200px' }}>
                  <BlockStack gap="100">
                    <Text as="p" variant="headingMd">1.8s</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Avg Response Time</Text>
                  </BlockStack>
                </div>
                <div style={{ minWidth: '200px' }}>
                  <BlockStack gap="100">
                    <Text as="p" variant="headingMd">94%</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Accuracy Rate</Text>
                  </BlockStack>
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
