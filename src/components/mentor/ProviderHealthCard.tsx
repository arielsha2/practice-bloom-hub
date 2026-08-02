import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ServerCog } from "lucide-react";

interface ProviderEventRow {
  status_code: number | null;
  fallback_used: boolean;
  created_at: string;
}

export function ProviderHealthCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProviderEventRow[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("mentor_provider_events")
      .select("status_code, fallback_used, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as ProviderEventRow[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const total = rows.length;
  const byStatus = new Map<string, number>();
  rows.forEach((r) => {
    const key = r.status_code ? String(r.status_code) : "network error";
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerCog className="w-5 h-5 text-primary" />
          אירועי ספק AI ב-24 השעות האחרונות
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            אין אירועי כשל בנתיב ה-Gemini הישיר ב-24 השעות האחרונות.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-600">
              {total} מעברי fallback מ-Gemini הישיר ל-Lovable Gateway
            </p>
            <div className="flex flex-wrap gap-2">
              {[...byStatus.entries()].map(([status, count]) => (
                <span
                  key={status}
                  className="text-xs px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800"
                >
                  {status}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
