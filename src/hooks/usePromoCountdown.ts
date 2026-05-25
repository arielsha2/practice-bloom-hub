import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const PROMO_KEY = 'turning_point_discount';

export function usePromoCountdown() {
  const [target, setTarget] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('promo_settings')
        .select('countdown_target')
        .eq('key', PROMO_KEY)
        .maybeSingle();
      if (!active) return;
      setTarget(data?.countdown_target ? new Date(data.countdown_target) : null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return { target, loading };
}
