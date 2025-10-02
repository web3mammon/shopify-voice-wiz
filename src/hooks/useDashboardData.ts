import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DashboardStats {
  totalCalls: number;
  activeCalls: number;
  avgSentiment: number;
  resolvedIssues: number;
  salesImpact: string;
}

interface RecentCall {
  id: string;
  customer: string;
  topic: string;
  sentiment: string;
  duration: string;
  timestamp: string;
}

export const useDashboardData = (dateFilter: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    activeCalls: 0,
    avgSentiment: 0,
    resolvedIssues: 0,
    salesImpact: '$0',
  });
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get date range based on filter
        const now = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'yesterday':
            startDate = new Date(now.setDate(now.getDate() - 1));
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'last3days':
            startDate = new Date(now.setDate(now.getDate() - 3));
            break;
          case 'last7days':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'thismonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'lastmonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          default:
            startDate = new Date(now.setDate(now.getDate() - 7));
        }

        // Fetch conversations
        const { data: conversations, error } = await supabase
          .from('voice_conversations')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        processConversationData(conversations || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    const processConversationData = (conversations: any[]) => {
      // Calculate stats
      const totalCalls = conversations.length;
      const sentiments = conversations.filter(c => c.sentiment).map(c => {
        if (c.sentiment === 'positive') return 5;
        if (c.sentiment === 'neutral') return 3;
        return 1;
      });
      const avgSentiment = sentiments.length > 0 
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
        : 0;

      setStats({
        totalCalls,
        activeCalls: 0,
        avgSentiment: Number(avgSentiment.toFixed(1)),
        resolvedIssues: Math.floor(totalCalls * 0.89),
        salesImpact: `$${Math.floor(totalCalls * 50).toLocaleString()}`,
      });

      // Format recent calls
      const recent = conversations.slice(0, 3).map(conv => {
        const duration = Math.floor((conv.duration_seconds || 0) / 60) + ':' + 
          String((conv.duration_seconds || 0) % 60).padStart(2, '0');
        const timestamp = new Date(conv.created_at);
        const minutesAgo = Math.floor((Date.now() - timestamp.getTime()) / 60000);
        
        return {
          id: conv.id,
          customer: conv.customer_identifier || 'Unknown',
          topic: conv.topic || 'General inquiry',
          sentiment: conv.sentiment || 'neutral',
          duration,
          timestamp: minutesAgo < 60 
            ? `${minutesAgo} minutes ago` 
            : `${Math.floor(minutesAgo / 60)} hours ago`,
        };
      });

      setRecentCalls(recent);

      // Generate chart data
      const groupedByHour: Record<string, number> = {};
      conversations.forEach(conv => {
        const hour = new Date(conv.created_at).getHours();
        const timeKey = `${hour}:00`;
        groupedByHour[timeKey] = (groupedByHour[timeKey] || 0) + 1;
      });

      const chartPoints = Object.entries(groupedByHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .slice(-6)
        .map(([time, calls]) => ({
          time,
          calls,
          sentiment: avgSentiment,
        }));

      setChartData(chartPoints);
    };

    const setupRealtimeSubscription = async () => {
      // Set up realtime subscription
      channel = supabase
        .channel('voice_conversations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'voice_conversations'
          },
          async (payload) => {
            console.log('Realtime update:', payload);
            
            // Refetch data on any change
            const { data } = await supabase
              .from('voice_conversations')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (data) {
              processConversationData(data);
            }
          }
        )
        .subscribe();
    };

    fetchData();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [dateFilter]);

  return { stats, recentCalls, chartData, loading };
};
