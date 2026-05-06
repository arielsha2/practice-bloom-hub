import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Row = {
  user_id: string;
  step_number: number;
  stuck_points: string[] | null;
  reflection: Record<string, unknown> | null;
};

export default function AdminInsights() {
  const { loading: authLoading, user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-insights");
      if (error) throw error;
      setRows((data?.rows ?? []) as Row[]);
      setInsight(data?.insight ?? "");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground">Admin Insights</h1>
              <p className="text-sm text-muted-foreground mt-1">Therapist journeys, stuck points & AI pattern analysis.</p>
            </div>
            <Button onClick={load} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Stuck Points</TableHead>
                    <TableHead>Reflections</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No journeys yet.</TableCell></TableRow>
                  )}
                  {rows.map((r) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                      <TableCell className="font-medium">{r.step_number}</TableCell>
                      <TableCell className="max-w-md">
                        {(r.stuck_points ?? []).length === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <ul className="list-disc ps-4 space-y-1 text-sm">
                            {(r.stuck_points ?? []).map((sp, i) => <li key={i}>{sp}</li>)}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                          {r.reflection && Object.keys(r.reflection).length ? JSON.stringify(r.reflection, null, 2) : "—"}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-serif font-semibold">AI Pattern Analysis</h2>
            </div>
            {loading && !insight ? (
              <p className="text-muted-foreground text-sm">Analyzing patterns…</p>
            ) : insight ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No analysis available yet.</p>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
