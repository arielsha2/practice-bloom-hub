import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function DiagnosisAIInsightsCard() {
  const [insight, setInsight] = useState("");
  const [sampleSize, setSampleSize] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-diagnosis-insights");
      if (error) throw error;
      setInsight(data?.insight ?? "");
      setSampleSize(data?.sample_size ?? 0);
    } catch (e) {
      console.error(e);
      toast.error("ניתוח הקשיים נכשל");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          ניתוח מעמיק — הקשיים והשפעתם על הקליניקה
        </CardTitle>
        <Button onClick={load} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 ml-1.5 ${loading ? "animate-spin" : ""}`} />
          רענן ניתוח
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !insight ? (
          <p className="text-sm text-muted-foreground">מנתח את הדפוסים...</p>
        ) : insight ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">מבוסס על {sampleSize} אבחונים — מדגם קטן, לפרש בזהירות.</p>
            <div className="prose prose-sm max-w-none dark:prose-invert" dir="rtl">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">אין עדיין מספיק תוצאות אבחון לניתוח.</p>
        )}
      </CardContent>
    </Card>
  );
}
