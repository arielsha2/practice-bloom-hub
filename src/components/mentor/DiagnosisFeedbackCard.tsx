import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquareText, ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackRow {
  id: string;
  email: string | null;
  rating: "up" | "down";
  feedback_text: string | null;
  recommended_tool: string | null;
  created_at: string;
}

export function DiagnosisFeedbackCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FeedbackRow[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("diagnosis_feedback")
      .select("id, email, rating, feedback_text, recommended_tool, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as FeedbackRow[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const upCount = rows.filter((r) => r.rating === "up").length;
  const downCount = rows.filter((r) => r.rating === "down").length;
  const total = rows.length;
  const downWithText = rows.filter((r) => r.rating === "down" && r.feedback_text);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-primary" />
          זה הרגיש מדויק? — משוב ישיר על האבחון
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">עדיין אין משוב.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <ThumbsUp className="w-4 h-4 text-accent" />
                <span className="font-semibold">{upCount}</span>
                <span className="text-muted-foreground">
                  · {total > 0 ? Math.round((upCount / total) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <ThumbsDown className="w-4 h-4 text-destructive" />
                <span className="font-semibold">{downCount}</span>
                <span className="text-muted-foreground">
                  · {total > 0 ? Math.round((downCount / total) * 100) : 0}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">מתוך {total} תגובות</span>
            </div>

            {downWithText.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  למה זה לא הרגיש מדויק — במילים שלהם
                </p>
                <div className="space-y-2">
                  {downWithText.map((r) => (
                    <div key={r.id} className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5">
                      <p className="text-sm text-foreground/90">{r.feedback_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.email || "—"} · {r.recommended_tool ?? "—"} ·{" "}
                        {new Date(r.created_at).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
