import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WidgetConfig {
  position: 'bottom-left' | 'bottom-right';
  primary_color: string;
  button_text: string;
}

export function useWidgetConfig() {
  const [config, setConfig] = useState<WidgetConfig>({
    position: 'bottom-right',
    primary_color: '#008060',
    button_text: 'Chat with AI',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Get the demo shop ID (in production, this would come from auth/context)
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('shop_domain', 'demo-store.myshopify.com')
        .single();

      if (!shops) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('widget_config')
        .select('*')
        .eq('shop_id', shops.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading widget config:', error);
      } else if (data) {
        setConfig({
          position: data.position as 'bottom-left' | 'bottom-right',
          primary_color: data.primary_color,
          button_text: data.button_text || 'Chat with AI',
        });
      }
    } catch (error) {
      console.error('Error loading widget config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<WidgetConfig>) => {
    try {
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('shop_domain', 'demo-store.myshopify.com')
        .single();

      if (!shops) return { success: false };

      const { error } = await supabase
        .from('widget_config')
        .upsert({
          shop_id: shops.id,
          position: updates.position || config.position,
          primary_color: updates.primary_color || config.primary_color,
          button_text: updates.button_text || config.button_text,
        });

      if (error) {
        console.error('Error updating widget config:', error);
        return { success: false };
      }

      setConfig({ ...config, ...updates });
      return { success: true };
    } catch (error) {
      console.error('Error updating widget config:', error);
      return { success: false };
    }
  };

  return { config, loading, updateConfig };
}
