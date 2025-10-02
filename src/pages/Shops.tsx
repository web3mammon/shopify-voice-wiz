import { Page, Layout, Card, DataTable, Badge, Text, InlineStack, Button, BlockStack } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Shop {
  id: string;
  shop_domain: string;
  is_active: boolean;
  created_at: string;
  subscription?: {
    plan_name: string;
    status: string;
    conversations_used: number;
    max_conversations: number;
  };
}

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      // Fetch shops with their subscriptions
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select(`
          id,
          shop_domain,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (shopsError) throw shopsError;

      // Fetch subscription data for each shop
      const shopsWithSubs = await Promise.all(
        (shopsData || []).map(async (shop) => {
          const { data: subData } = await supabase
            .from('shop_subscriptions')
            .select(`
              status,
              conversations_used,
              subscription_plans (
                name,
                max_conversations_per_month
              )
            `)
            .eq('shop_id', shop.id)
            .eq('status', 'active')
            .single();

          return {
            ...shop,
            subscription: subData ? {
              plan_name: subData.subscription_plans?.name || 'Unknown',
              status: subData.status,
              conversations_used: subData.conversations_used || 0,
              max_conversations: subData.subscription_plans?.max_conversations_per_month || 0,
            } : undefined,
          };
        })
      );

      setShops(shopsWithSubs);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const tones: Record<string, 'success' | 'info' | 'warning' | 'critical'> = {
      active: 'success',
      cancelled: 'warning',
      suspended: 'critical',
      past_due: 'critical',
    };
    return <Badge tone={tones[status] || 'info'}>{status}</Badge>;
  };

  const rows = shops.map((shop) => [
    shop.shop_domain,
    shop.subscription ? (
      <Text as="span" variant="bodyMd">
        {shop.subscription.plan_name}
      </Text>
    ) : (
      <Badge tone="warning">No Subscription</Badge>
    ),
    shop.subscription ? getStatusBadge(shop.subscription.status) : '-',
    shop.subscription ? (
      <Text as="span" variant="bodyMd">
        {shop.subscription.conversations_used} / {shop.subscription.max_conversations}
      </Text>
    ) : '-',
    shop.is_active ? (
      <Badge tone="success">Active</Badge>
    ) : (
      <Badge>Inactive</Badge>
    ),
    new Date(shop.created_at).toLocaleDateString(),
    <Button size="slim" onClick={() => window.location.href = `/shops/${shop.id}`}>
      Manage
    </Button>,
  ]);

  return (
    <Page
      title="Shops & Clients"
      subtitle="Manage all installed Shopify stores and their subscriptions"
      primaryAction={{
        content: 'Refresh',
        onAction: fetchShops,
      }}
    >
      <Layout>
        {/* Overview Stats */}
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Total Shops
                </Text>
                <Text as="p" variant="heading2xl">
                  {shops.length}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Active Subscriptions
                </Text>
                <Text as="p" variant="heading2xl">
                  {shops.filter(s => s.subscription?.status === 'active').length}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Past Due
                </Text>
                <Text as="p" variant="heading2xl">
                  {shops.filter(s => s.subscription?.status === 'past_due').length}
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Shops Table */}
        <Layout.Section>
          <Card>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Text as="p" variant="bodyMd">
                  Loading shops...
                </Text>
              </div>
            ) : (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                headings={[
                  'Shop Domain',
                  'Plan',
                  'Subscription Status',
                  'Conversations Used',
                  'Shop Status',
                  'Installed',
                  'Actions',
                ]}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
