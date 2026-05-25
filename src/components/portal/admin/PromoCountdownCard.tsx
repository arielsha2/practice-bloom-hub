import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Timer } from 'lucide-react';
import { PROMO_KEY } from '@/hooks/usePromoCountdown';

// Convert ISO timestamp -> value for <input type="datetime-local"> in local TZ
function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PromoCountdownCard() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('promo_settings')
        .select('countdown_target')
        .eq('key', PROMO_KEY)
        .maybeSingle();
      setValue(toLocalInputValue(data?.countdown_target ?? null));
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const iso = value ? new Date(value).toISOString() : null;
      const { error } = await supabase
        .from('promo_settings')
        .upsert(
          { key: PROMO_KEY, countdown_target: iso, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) throw error;
      toast.success('שעון לאחור עודכן');
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setValue('');
    setSaving(true);
    try {
      const { error } = await supabase
        .from('promo_settings')
        .upsert(
          { key: PROMO_KEY, countdown_target: null, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) throw error;
      toast.success('שעון לאחור הוסר');
    } catch (e) {
      console.error(e);
      toast.error('שגיאה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          שעון לאחור להנחת ההרשמה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="promo-countdown">תאריך ושעת סיום ההנחה</Label>
          <Input
            id="promo-countdown"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
            dir="ltr"
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            השעון יוצג בעמוד "נקודת המפנה" מתחת למשפט ההנחה ויראה ימים, שעות, דקות ושניות. השאר ריק כדי להסתיר אותו.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || loading}>
            שמור
          </Button>
          <Button variant="outline" onClick={clear} disabled={saving || loading}>
            הסר שעון
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
