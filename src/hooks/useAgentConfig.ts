import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgentConfig {
  is_enabled: boolean;
  greeting_message: string;
  system_prompt: string;
  voice_model: string;
  max_duration_minutes: number;
}

export const useAgentConfig = () => {
  const [config, setConfig] = useState<AgentConfig>({
    is_enabled: true,
    greeting_message: 'Hi! How can I help you today?',
    system_prompt: 'You are a helpful e-commerce assistant.',
    voice_model: 'alloy',
    max_duration_minutes: 10,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('agent_config')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setConfig({
            is_enabled: data.is_enabled ?? true,
            greeting_message: data.greeting_message ?? 'Hi! How can I help you today?',
            system_prompt: data.system_prompt ?? 'You are a helpful e-commerce assistant.',
            voice_model: data.voice_model ?? 'alloy',
            max_duration_minutes: data.max_duration_minutes ?? 10,
          });
        }
      } catch (error) {
        console.error('Error fetching agent config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const updateConfig = async (updates: Partial<AgentConfig>) => {
    try {
      const { data: existingConfig } = await supabase
        .from('agent_config')
        .select('id')
        .limit(1)
        .single();

      if (existingConfig) {
        const { error } = await supabase
          .from('agent_config')
          .update(updates)
          .eq('id', existingConfig.id);

        if (error) throw error;
      }

      setConfig(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Error updating agent config:', error);
      return { success: false, error };
    }
  };

  return { config, loading, updateConfig };
};
