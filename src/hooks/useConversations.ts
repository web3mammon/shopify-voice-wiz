import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  id: string;
  customer_identifier: string;
  topic: string;
  sentiment: string;
  duration_seconds: number;
  transcript: any;
  created_at: string;
  formattedDuration: string;
  formattedTime: string;
}

export const useConversations = (searchQuery?: string, sentimentFilter?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('voice_conversations')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply sentiment filter
        if (sentimentFilter && sentimentFilter !== 'all') {
          query = query.eq('sentiment', sentimentFilter);
        }

        // Apply search filter
        if (searchQuery && searchQuery.trim() !== '') {
          query = query.or(`customer_identifier.ilike.%${searchQuery}%,topic.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Format conversations
        const formatted = data?.map(conv => {
          const duration = Math.floor((conv.duration_seconds || 0) / 60) + ':' + 
            String((conv.duration_seconds || 0) % 60).padStart(2, '0');
          
          const date = new Date(conv.created_at);
          const time = date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            ...conv,
            formattedDuration: duration,
            formattedTime: time,
          };
        }) || [];

        setConversations(formatted);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [searchQuery, sentimentFilter]);

  return { conversations, loading };
};
