import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pencil, Save, X, ExternalLink } from 'lucide-react';

const SETTING_KEY = 'looker_analytics_url';

export function LookerEmbed() {
  const [url, setUrl] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', SETTING_KEY)
        .maybeSingle();
      const v = data?.value ?? '';
      setUrl(v);
      setDraft(v);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: SETTING_KEY, value: draft.trim(), updated_by: userRes.user?.id, updated_at: new Date().toISOString() });
    if (error) {
      toast.error('שמירה נכשלה: ' + error.message);
      return;
    }
    setUrl(draft.trim());
    setEditing(false);
    toast.success('נשמר');
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">תנועה לאתר (GA4 דרך Looker Studio)</CardTitle>
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 ml-1" />
            ערוך קישור
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {editing && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              dir="ltr"
              placeholder="https://lookerstudio.google.com/embed/reporting/..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>
                <Save className="w-4 h-4 ml-1" /> שמור
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(url); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">טוען…</p>
        ) : url ? (
          <div className="space-y-2">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-md border bg-muted">
              <iframe
                src={url}
                className="w-full h-full"
                allow="fullscreen"
                title="Looker Studio Analytics"
              />
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              פתח בחלון חדש <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              עדיין לא הוגדר דוח Looker Studio. צור דוח ב-Looker Studio המחובר ל-GA4, העתק את קישור ה-Embed והדבק אותו כאן.
            </p>
            {!editing && (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 ml-1" /> הוסף קישור
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
